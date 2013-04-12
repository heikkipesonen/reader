var IMG_URL = 'http://ereading.metropolia.fi/puru/img/'; // image base url
var MAX_SIZE = 0;


// colors by news category, values in rgba-format

var colors = {
	etusivu:[0,0,0,0.8],
	ulkomaat:[0,0,0,0.8],
	uutiset:[0,105,153,0.6],
	kulttuuri:[228,23,93,0.8],
	urheilu:[90,55,120,0.8],
	artikkeli:[0,136,130,0.8],
	teema:[0,136,130,0.8],
	defaultColor:[0,0,0,0.8],
	getColor:function(name){
		name = name.toLowerCase();
		if (this[name]){	
			return 'rgba('+this[name].join(',') +')';
		} else {
			return 'rgba('+this.defaultColor.join(',') +')';
		}
	}
}

var bg = {
	'01':[147,186,122,1],
	'02':[86,177,255,1],
	'03':[120,100,239,1],
	'04':[219,101,49,1],
	'05':[91,195,89,1],
	'06':[198,45,67,1],
	'07':[200,255,200,1],
	'08':[200,255,200,1],
	'09':[200,255,200,1],
	'10':[200,255,200,1],
	'11':[200,255,200,1],
	'12':[200,0,0,1],
	'default':[198,45,67,1]
}




var rupu = function(){
	// iscroll common options
	this.iscrollOpts = {
		hScrollbar:true,
		vScrollbar:true,
		fadeScrollbar:true,
		hideScrollbar:true,
		lockDirection:true
	}
	this.mainSrollOpts = {
		snap:'.pane',
		momentum:false,
		vScrollbar:false,
		hScrollbar:false,
		SnapThreshold:500,
		lockDirection:true
	}


	// elements for rupu to use
	this.panes = {	
		left : $('<div id="left-pane" class="pane"></div>'),
		leftList : $('<div id="left-pane-list" class="pane"></div>'),
		right : $('<div id="right-pane" class="pane"></div>'),
		main : $('<div id="main-pane" class="pane"></div>'),
		main_scroller : $('<div id="main-pane-scroller"></div>'),
		main_content : $('<div id="main-pane-content"></div>'),
		container : $('<div id="main"></div>'),
		
		opts:{
			rightPane:[20,100], // pane dimensions in percent, width and height
			leftPane:[90,100],
			mainPane:[96,100],
			rightPaneMax:300,	// maximum width in pixels
			rightPaneMin:200,	// minimum width in pixels
			leftPaneMax:900,	// for left pane
			leftPaneMin:600
		}
	}

	this.mainScroll = false; // iscroll for main element, the horizontal scroller
	this.pageScroll=false;	// page, item display scroller
	this.mainPaneScroll=false;	// main pane, the tile display scroll
	this.tools = {};		// toolbar
	this._listeners =[]; // event listeners registered for rupu

	this._db = new dblink({
							url:'http://cdb.ereading.metropolia.fi/reader',
							designDocument:'news'
						});

	this._news = new itemStore();
}
rupu.prototype = {
	// percentage values for window sizes
	_getWidth:function(pc){
		return pc[0]* (window.innerWidth/100)
	},
	_getHeight:function(pc){
		return pc[1]* (window.innerHeight/100)
	},
	// start rupu
	// container is the element for rupu run in
	start:function(container){
		var me = this;
		this.tools = new toolbar('toolbar');
		this.panes.container
				.append(this.panes.left)
				.append(this.panes.leftList)
				.append(this.panes.main.append(this.panes.main_scroller.append(this.panes.main_content)))
				.append(this.panes.right);
		

		$(container).append(this.panes.container);

		this.panes.left.hammer().on('tap',function(){
			me._showPane('main-pane');
		});

		this.tools.setSize(['100%','100%'])
		this.panes.right.append( this.tools.getElement() );	
		
		this.mainScroll = new iScroll($(container).attr('id'),this.mainSrollOpts);
		this._showPane('main-pane',0);

		this._fire('start');	

		this._db.getDates(function(e){
			console.log(e);
		})
	},
	// scale the elements according to screen size changes
	scale:function() {		
		this._fire('scale');
	},
	// scroll to certain pane with mainscroll-horizontal scroll
	_showPane:function(id,time){
		if (time==undefined){
			time=300;
		}
		if (this.mainScroll){
			this.mainScroll.scrollToElement('#'+id,time);
			this._fire('showPane',id);
		}
	},
	// test news item size
	_testSize:function(item){
		if (item.hasClass('smallListItem')){
			return 's';
		} else {
			return 'b';
		}
	},
	getList:function(items){
		var e = itemBuilder.getList(items);

	},
	// show category of items by category name
	showItems:function(items){
		var me = this;		
		//var types = newsParser.getTypeCount(items);
		var e = [];
		each(items,function(item){
			e.push(item.getTile());
		});
		this._showAtPane(e);
		this._fire('showItems',items);
	},
	showCategory:function(cat){
		this.tools.selectButton(cat);
		var items = this._news.get('category',cat);
		
		this.showItems(items);
		this._fire('categoryChange',cat);
		this._showPane('main-pane');
	},
	// show news item in left pane display
	showItem:function(id){
		var me = this;
		var container = this.panes.left;
		
		if (container.find('[data-item="'+id+'"]').length > 0){
			me._showPane('left-pane');
		} else {
			//var e = itemBuilder.fullView(id);

			container.transit({
				opacity:0,
			},200,function(){
				container.html(e);
				me._showPane('left-pane');
				if (me.pageScroll){
					me.pageScroll.destroy();
				}

				container.transit({opacity:1});
				me.pageScroll = new iScroll('page',this.iscrollOpts);
				me._fire('showItem',id);
			});

		}
	},
	_showAtPane:function(content){
		var container = this.panes.main_content;
		var me = this;
		
		this._fire('pageChangeStart');
		

		container.transit({
			opacity:0
		},200,function(){

			container.empty();
		

			each(content,function(item){
				container.append(item);
			});

			container.freetile({
				animate:false,
				callback:function(){

					if (me.mainPaneScroll && me.mainPaneScroll!=undefined){
						me.mainPaneScroll.destroy();
					}

					me.mainPaneScroll = new iScroll('main-pane',me.iscrollOpts);

					container.transit({
						opacity:1
					},200,function(){
						me._fire('pageChangeReady');
						me._fire('pageReady');
					});
				}
			});

		})
	},
	_setMenu:function(){
		var me = this;
		/*
		var categories = newsParser.getCategories();
		
		me.tools.reset();

		me.tools.addButton({
			text:"valikko",
			id:"menu",					
			bg:colors['defaultColor'],
			spancolor:[250,250,250,0.4],
			action:function(id){
				console.log(id);
			},
			target:"menu"
		});

		each(categories,function(catg){
				me.tools.addButton({
						text:catg.name,
						id:catg.name,
						span:catg.items,
						bg:colors[catg.name] || colors['defaultColor'],
						spancolor:[250,250,250,0.4],
						action:function(id){
							me.showCategory(id);
						},
						target:catg.name
				});
		});

		me.tools.scaleHeight();
		me.scale();		
		*/
	},
	getCategories:function(){
		return this._news.getKeys('category');
	},
	getDate:function(date,end_date,callback){
		var me = this;
		this._fire('loadstart');		
		
		this._db.getView({
			startkey:dateParser.convert(date),
			endkey:dateParser.convert(end_date),
			view:'strdate',
			callback:function(e){

				for (var i in e){
					me._news.add(new newsItem(e[i]));
				}

				if (typeof(callback) == 'function'){
					callback(e);
				}				
				me._fire('load',e);
			}
		});
	},

	on:function(name,fn){		
		if (this._listeners[name] == undefined){
			this._listeners[name] = Array();
		}	
		this._listeners[name].push(fn);		
	},
	_fire : function(evt,data,e){		
		for (var i in this._listeners['all']){			
			if (this._listeners['all'][i]!=undefined && typeof(this._listeners['all'][i])== 'function'){						
				this._listeners['all'][i](evt,data,e);
			}
		}
		if (this._listeners[evt]!=undefined){
			for (var i in this._listeners[evt]){
				if (typeof(this._listeners[evt][i])=='function'){
					this._listeners[evt][i](data,e);
				}
			}			
		}
	},
	off:function(evt){
		delete this._listeners[evt];
	}	
}
