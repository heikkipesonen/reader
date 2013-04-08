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






var rupu = function(){
	// iscroll common options
	this.iscrollOpts = {
		hScrollbar:true,
		vScrollbar:true,
		fadeScrollbar:true,
		hideScrollbar:true
	}
	// elements for rupu to use
	this.panes = {	
		left : $('<div id="left-pane" class="pane"></div>'),
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
	this.lastResizeTime=0;	// resize delay system, to be done.
	this.resizeInterval=500;	
	this._listeners =[]; // event listeners registered for rupu
}
rupu.prototype = {
	// percentage values for window sizes
	getWidth:function(pc){
		return pc[0]* (window.innerWidth/100)
	},
	getHeight:function(pc){
		return pc[1]* (window.innerHeight/100)
	},
	// start rupu
	// container is the element for rupu run in
	start:function(container){
		var me = this;
		this.tools = new toolbar('toolbar');
		this.panes.container
				.append(this.panes.left)
				.append(this.panes.main.append(this.panes.main_scroller.append(this.panes.main_content)))
				.append(this.panes.right);
		

		$(container).append(this.panes.container);

		this.panes.left.hammer().on('tap',function(){
			me.showPane('main-pane');
		});

		this.tools.setSize(['100%','100%'])
		this.panes.right.append( this.tools.getElement() );


		$(window).resize(function(){
			me.scale();
		});

		
		this.scale();
		this.getItems(1,false);
		this._fire('start');
	},
	// scale the elements according to screen size changes
	scale:function() {
		this.lastResizeTime = Date.now();

		this.panes.left.css({
			position:'absolute',
			top:'0px',
			left:'0px',
			width:this.getWidth(this.panes.opts.leftPane) > this.panes.opts.leftPaneMax ? this.panes.opts.leftPaneMax : this.getWidth(this.panes.opts.leftPane) < this.panes.opts.leftPaneMin ? this.panes.opts.leftPaneMin : this.getWidth(this.panes.opts.leftPane),
			height:this.getHeight(this.panes.opts.leftPane)
		});

		this.panes.main.css({
			position:'absolute',
			top:'0px',
			left:this.panes.left.width(),

			width:this.getWidth(this.panes.opts.mainPane),
			height:this.getHeight(this.panes.opts.mainPane)
		});
		
		this.panes.main_scroller.css({
			'min-height':this.panes.main.height(),
			width:this.panes.main.width()
		});

		this.panes.right.css({
			position:'absolute',
			top:'0px',
			left:this.panes.left.width() + this.panes.main.width(),

			width:this.getWidth(this.panes.opts.rightPane) > this.panes.opts.rightPaneMax ? this.panes.opts.rightPaneMax : this.getWidth(this.panes.opts.rightPane) < this.panes.opts.rightPaneMin ? this.panes.opts.rightPaneMin : this.getWidth(this.panes.opts.rightPane),
			height:this.getHeight(this.panes.opts.rightPane)
		});

		this.panes.container.css({
			width:this.panes.left.width() + this.panes.main.width() + this.panes.right.width(),
			height:window.innerHeight
		});


		if (this.mainPaneScroll && this.mainPaneScroll!=undefined){
			this.mainPaneScroll.destroy();
		}
		this.mainPaneScroll = new iScroll('main-pane',this.iscrollOpts);
		if (this.tools){
			this.tools.scaleHeight();
		}
		this._fire('scale');
	},
	// scroll to certain pane with mainscroll-horizontal scroll
	showPane:function(id,time){
		if (time==undefined){
			time=300;
		}
		if (this.mainScroll){
			this.mainScroll.scrollToElement('#'+id,time);
			this._fire('showPane',id);
		}
	},
	// test news item size
	testSize:function(item){
		if (item.hasClass('smallListItem')){
			return 's';
		} else {
			return 'b';
		}
	},
	// show category of items by category name
	showItems:function(items){
		var me = this;
		var e = itemBuilder.build(items,{
											b:'b',
											s:'b',
											tap:function(id){													
												me.showItem(id); 
											}
										});
		
		var types = newsParser.getTypeCount(items);

		if (types.b%2 != 0){
			var found =false;
			var me = this;
			
			each(e,function(item){
			 	if (me.testSize(item) == 'b' && item.hasClass('wide') && !found){
					found = true;
					item.addClass('important');
				}
			});
			
		}

		this.showAtPane(e);
		this._fire('showItems',items);
	},
	showCategory:function(cat){
		this.tools.selectButton(cat);
		var items = newsParser.getCategory(cat);
		this.showItems(items);
		this._fire('categoryChange',cat);
		this.showPane('main-pane');
	},
	// show news item in left pane display
	showItem:function(id){
		var me = this;
		var container = this.panes.left;
		
		if (container.find('[data-item="'+id+'"]').length > 0){
			me.showPane('left-pane');
		} else {
			var e = itemBuilder.fullView(id);

			container.transit({
				opacity:0,
			},200,function(){
				container.html(e);
				me.showPane('left-pane');
				if (me.pageScroll){
					me.pageScroll.destroy();
				}

				container.transit({opacity:1});
				me.pageScroll = new iScroll('page',this.iscrollOpts);
				me._fire('showItem',id);
			});

		}
	},
	showAtPane:function(items){
		var container = this.panes.main_content;
		var me = this;
		
		this._fire('pageChangeStart');
		

		container.transit({
			opacity:0
		},200,function(){

			container.empty();
		
			each(items,function(item){
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
					});
				}
			});

		})
	},
	getItems:function(days,until,callback){
		var me = this;

		newsParser.getNews(days,until,function(news){

			if (news){				

				var categories = newsParser.getCategories();

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
				me.showCategory('etusivu');
				me.scale();
				
				me.mainScroll = new iScroll('main-container',{snap:'.pane',momentum:false,vScrollbar:false,hScrollbar:false,SnapThreshold:500,lockDirection:true});
				me.showPane('main-pane',0);
				me._fire('load');
			}
		});
	},
	getDatesList:function(){
		var me = this;

		newsParser.getDatabaseDates(function(list){
			console.log(list);
			
			each(list,function(item){

			});
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
