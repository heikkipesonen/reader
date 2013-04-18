var SMALLIMG_URL = 'http://ereading.metropolia.fi/puru/img/small/'; // image base url
var FULLIMG_URL = 'http://ereading.metropolia.fi/puru/img/'; // image base url
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
		list : $('<div id="list-pane" class="pane"></div>'),
		right : $('<div id="right-pane" class="pane"></div>'),
		main : $('<div id="main-pane" class="pane"></div>'),
		main_scroller : $('<div id="main-pane-scroller"></div>'),
		main_content : $('<div id="main-pane-content"></div>'),
		container : $('<div id="main"></div>'),
		menu:$('<div id="date-menu" class="pane"></div>')
	}

	this._mainScroll = false; // iscroll for main element, the horizontal scroller
	this._pageScroll=false;	// page, item display scroller
	this._mainPaneScroll=false;	// main pane, the tile display scroll
	this._listScroll=false;
	this.tools = {};		// toolbar
	this._listeners =[]; // event listeners registered for rupu
	this._dates = [];

	this._db = new dblink({
							url:'http://cdb.ereading.metropolia.fi/reader',
							designDocument:'news'
						});

	this._news = new itemStore();

}
rupu.prototype = {
	// start rupu
	// container is the element for rupu run in
	start:function(container){
		var me = this;
		this.tools = new toolbar('toolbar');
		this.panes.container
				.append(this.panes.list)
				.append(this.panes.left.append(this.panes.left_newscontainer))
				//.append(this.panes.leftList)
				.append(this.panes.main.append(this.panes.main_content))
				//.append(this.panes.main_scroller.append(this.panes.main_content))
				.append(this.panes.right);
		

		$(container).append(this.panes.container);
		$(container).append(this.panes.menu);

		this._container = $(container);

		this.panes.left.hammer().on('tap',function(){
			me._showPane('main-pane');
		});

		this.tools.setSize(['100%','100%'])
		this.panes.right.append( this.tools.getElement() );	
		
		this.scale();
		this._showPane('main-pane',0);

		this._setMenu();
		this._fire('start');	

		
		this.on('load',function(){
			me._setMenu();
			me._sortItems();
			me._createList();
			me._showPane('main-pane');
		});

		$(window).resize(function(){
			me.scale();
		})

	},	
	error:function(e){
		console.log(e);
	},
	_getDatesMenu:function(callback){
		var me = this;
		this._db.getDates(function(dates){
			me._buildDateMenu(dates);

			if (typeof(callback) == 'function'){
				callback(me._dateMenu);
			}
		});
	},
	_buildDateMenu:function(list){
		var me = this;

		each(list,function(item){
			item._id = item.date;
			item.largetext = item.date;
			item.smalltext = item.count;
		});


		var gm = new gridMenu('menu');
		gm.addButton({
			largetext:'ok',
			smalltext:'accept selection',
			_id:'return'
		});
		gm.addButton({
			largetext:'clear',
			smalltext:'deselect',
			_id:'deselect'
		});				

		gm.addButton(list);
		gm.setSize(window.innerWidth,window.innerHeight);
		gm.setOption('selectMany',true);
		
		gm.eachButton(function(btn){
			btn.setBackgroundColor( bg[ dateParser.getMonth(btn.getId()) ] || bg.default);
		});

		gm.on('click',function(id,btn){
			if (id=='return'){
													
				me.getDate( gm.getSelectedId() ,false);
				me.hideDateMenu();
				
			} else if (id=='deselect'){
				gm.clear();
			} else {						
				gm.toggleButton(btn);
			}
		});		


		this._dateMenu = gm;
		this.panes.menu.html( gm.getElement() );
	},
	showDateMenu:function(){
		var me = this;
		if (this._dateMenu){
			this.panes.menu.css({
				opacity:0,
				display:'block'
			})
			this.panes.menu.transit({
				opacity:1
			},500,function(){
				me._fire('showDateMenu');
			});

		} else {
			this._getDatesMenu(function(){
				me.showDateMenu();
			});
		}
	},
	hideDateMenu:function(){
		var me = this;
		this.panes.menu.transit({
			opacity:0
		},function(){
			me.panes.menu.css({
				display:'none'
			});

			me._fire('hideDateMenu');
		})
	},
	// percentage values for window sizes
	_getWidth:function(pc){
		return pc[0]* (window.innerWidth/100)
	},
	_getHeight:function(pc){
		return pc[1]* (window.innerHeight/100)
	},

	// scale the elements according to screen size changes
	scale:function() {		

		this.panes.list.css({
			top:0,
			left:0

		});

		var leftWidth = window.innerWidth*0.5;
		leftWidth = leftWidth < 700 ? window.innerWidth : leftWidth > 900 ? 900 : leftWidth;
		this.panes.left.css({
			top:0,
			left:this.panes.list.width(),
			width:leftWidth
		});

		this.panes.main.css({
			width:window.innerWidth > 1500 ? 1500 : window.innerWidth,
			left:this.panes.left.width()+this.panes.list.width(),
			top:0
		});

		this.panes.right.css({
			left:this.panes.left.width() + this.panes.main.width()+this.panes.list.width(),
			top:0
		});

		this.panes.container.css({
			width: this.panes.left.width() + this.panes.main.width() + this.panes.right.width()+this.panes.list.width()
		});

		try{
			this._scrollRefresh();
			if (this._mainScroll){
				this._mainScroll.refresh();
			} else {
				
				this._mainScroll = new iScroll($(this._container).attr('id'),this.mainSrollOpts);				
			}
			
			

		} catch (e){
			this.error(e);
		}

		this._fire('scale');

	},
	_createList:function(){
		try{

			var list = $('<ul></ul>'),
				me = this;

			if (this._listScroll){
				this._listScroll.destroy();
			}

			this.panes.list.html(list);

			this._news.each(function(item){
				list.append( item.getListItem() );
			});


			this._listScroll = new iScroll('list-pane',this.iscrollOpts)

			list.find('li').hammer().on('tap',function(){
				me.showItem($(this).attr('id'),false);
			});

		} catch (e){			
			this.error(e);
		}
	},
	// scroll to certain pane with _mainScroll-horizontal scroll
	_showPane:function(id,time){
		if (time==undefined){
			time=300;
		}
		if (this._mainScroll){
			this._mainScroll.scrollToElement('#'+id,time);
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
	_sortSet:function(items){
		items.sort(function(a,b){
			if (a.priority && b.priority){
				return a.priority - b.priority;
			} else {
				return 0;
			}
		})
	},
	// show category of items by category name
	showItems:function(items){
		var me = this;				
		var e = [];

		this._sortSet(items);
		
		each(items,function(item){
			e.push(item.getTile());
		});
		

		this._showAtPane(e);
		this._fire('showItems',items);
	},
	showAll:function(){
		this.showItems(this._news.getItems());
		this._showPane('main-pane');
	},
	showCategory:function(cat){
		this.tools.selectButton(cat);
		var items = this._news.get('category',cat);
		this.showItems(items);
		this._fire('categoryChange',cat);
		this._showPane('main-pane');
	},
	// show news item in left pane display
	showItem:function(id,scrollTo){
		var me = this;
		var container = this.panes.left;
		
		if (container.find('[data-item="'+id+'"]').length > 0){
			if (scrollTo!=false){
				me._showPane('left-pane');
			}
		} else {
			var e = this._news.find(id).getFull();

			container.transit({
				opacity:0,
			},200,function(){
				container.html(e);
				
				if (scrollTo!=false){
					me._showPane('left-pane');
				}

				if (me._pageScroll){
					me._pageScroll.destroy();
				}

				container.transit({opacity:1});
				me._pageScroll = new iScroll('page',this.iscrollOpts);
				me._fire('showItem',id);
			});

		}
	},
	_scrollRefresh:function(){
		if (this._mainPaneScroll && this._mainPaneScroll!=undefined){
			this._mainPaneScroll.destroy();
		}
		
		this._mainPaneScroll = new iScroll('main-pane',this.iscrollOpts);						
	},
	_showAtPane:function(content){
		var container = this.panes.main_content;
		var me = this;
		
		this._fire('pageChangeStart');
		

		container.transit({
			opacity:0
		},500,function(){

			container.empty();
		
			each(content,function(item){
				item.hammer().on('tap',function(){
					me.showItem($(this).attr('id'));
				});

				container.append(item);
			});

			container.freetile({
				animate:false,
				callback:function(){

					me._scrollRefresh();

					container.transit({
						opacity:1
					},600,function(){
						me._fire('pageChangeReady');
						me._fire('pageReady');
					});
				}
			});

		})
	},
	_setMenu:function(){
		var me = this;
		var categories = this._news.getKeys('category');
		
		me.tools.reset();

		me.tools.addButton({
			text:"valikko",
			id:"menu",					
			bg:colors['defaultColor'],
			spancolor:[250,250,250,0.4],
			action:function(id){
				me.showDateMenu();
			},
			target:"menu"
		});

		
		each(categories,function(catg){
				catg = catg.toLowerCase();
				me.tools.addButton({
						text:catg,
						id:catg,
						span:me._news.get('category',catg).length,
						bg:colors[catg] || colors['defaultColor'],
						spancolor:[250,250,250,0.4],
						action:function(id){
							me.showCategory(id);
						},
						target:catg.name
				});
		});

		me.tools.scaleHeight();
		me.scale();		
	},
	_sortItems:function(){
		this._news.sort(function(a,b){
			if (a.category > b.category){
				return 1;
			} else {
				return -1;
			}
		});
	},
	getCategories:function(){
		return this._news.getKeys('category');
	},
	_hasDate:function(date){
		var found = false;
		for (var i in this._dates){
			if (this._dates[i] == date){
				found = true;
			}
		}
		return found;
	},
	_addNews:function(items){		
		for (var i in items){
			this._news.add(new newsItem(items[i]));
		}
	},
	loadDatesSet:function(dates){

	},
	getDate:function(date,end_date,callback,fire){
		var me = this;
		this._fire('loadstart');		
		
		if (date instanceof Array){
			 var count = date.length;

			 for (var i in date){
			 	this.getDate(date[i],false,function(e){
			 		count--;

				 	if (count == 0){
				 		console.log('e');
				 		me._fire('load');
				 	}
			 	},false);
			 }
		} else if (!this._hasDate(date)){

			this._dates.push(date);

			this._db.getView({
				startkey:dateParser.convert(date),
				endkey:dateParser.convert(end_date),
				view:'strdate',
				callback:function(e){
					me._addNews(e);
					if (typeof(callback) == 'function'){
						callback(e);
					}				
					if (fire != false){
						me._fire('load',e);
					}
				}
			});
		}
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
