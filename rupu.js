var SMALLIMG_URL = 'http://ereading.metropolia.fi/puru/img/small/'; // image base url
var FULLIMG_URL = 'http://ereading.metropolia.fi/puru/img/'; // image base url
var MAX_SIZE = 0;

var rupu = function(){
	// iscroll common options
	this.iscrollOpts = {
		hScrollbar:true,
		vScrollbar:true,
		fadeScrollbar:true,
		hideScrollbar:true,
		lockDirection:true
	}

	this.mainScrollOpts = {
		snap:'.pane',
		momentum:false,
		vScrollbar:false,
		hScrollbar:false,
		SnapThreshold:500,
		lockDirection:true
	}


	// elements for rupu to use
	this.panes = {	
		overlay:$('<div id="overlay"></div>'),
		top:$('<div id="top-bar"><div id="date"><h2></h2></div><div id="brand"><img src="brand.png" alt="" /></div></div>'),
		left : $('<div id="left-pane" class="pane"></div>'),
		right : $('<div id="right-pane" class="pane"></div>'),
		main : $('<div id="main-pane" class="pane"></div>'),
		main_scroller : $('<div id="main-pane-scroller"></div>'),
		main_content : $('<div id="main-pane-content"></div>'),
		container : $('<div id="main"></div>'),		
	}

	this._mainScroll = false; // iscroll for main element, the horizontal scroller
	this._pageScroll=false;	// page, item display scroller
	this._mainPaneScroll=false;	// main pane, the tile display scroll
	this._listScroll=false;
	this.tools = {};		// toolbar
	this._listeners =[]; // event listeners registered for rupu

}

rupu.prototype = {
	// start rupu
	// container is the element for rupu run in
	start:function(container){
		var me = this;
		this._db = new dblink({
								url:'http://cdb.ereading.metropolia.fi/reader',
								designDocument:'news'
							});

		this._news = new itemStore();
		this.tools = new toolbar('toolbar');

		this.panes.container
				.append(this.panes.left.append(this.panes.left_newscontainer))
				.append(this.panes.main.append(this.panes.main_content))
				.append(this.panes.right);
				
		$(container).parent().append(this.panes.top);
		$(container).append(this.panes.container);

		this._container = $(container);

		this.panes.left.hammer().on('tap',function(){
			me._showPane('main-pane');
			me._fire('hideItem');
		});




		this.tools.setSize(['100%','100%'])
		this.panes.right.append( this.tools.getElement() );	
	
		
		this.on('load',function(){
			me._setMenu();
			me._sortItems();
			me._showPane('main-pane');
		});

		$(window).resize(function(){
			if (me.panes.container.is(':visible')){
				me._showOverlay();
			}
			clearTimeout(me._onscale);
			
			me._onscale = setTimeout(function(){
				me.scale();
				me._hideOverlay();		
			},200);
		});

		this._initTopMenu();
		this._showPane('main-pane',0);
		this._setMenu();
		this._fire('start');	
		this.scale();
	},

	_initTopMenu:function(){
		var lastE = false, me = this,
			menu = this.panes.top;

		var listContainer = $('<div id="top-menu-list-container"></div>')
			list = $('<ul id="top-menu-list"></ul>');
		
		menu.append(listContainer.append(list));

		this._db.getDates(function(e){
			for (var i in e){
				list.append('<li class="top-menu-button '+e[i].date+'" data-date="'+e[i].date+'"><span class="date">'+e[i].date+'</span><span class="count">'+e[i].count+'</span></li>');
			}

			list.css({
				width: (list.find('li').outerWidth(true) * list.find('li').length) + 10,
			});
	
			list.find('li').hammer().on('tap',function(){
				$(this).parent().find('.selected').removeClass('selected');
				$(this).addClass('selected');

				me.getOnlyDate($(this).attr('data-date'));
			});
		});


		menu.hammer().on('tap',function(e){
			e.stopPropagation();
			if (me._isTopMenuVisible()){
				me.hideTopMenu();
			} else {
				me.showTopMenu();
			}
		});

		menu.hammer().on('dragdown',function(e){
			e.stopPropagation();
			
			if (lastE){
				if ((e.timeStamp - lastE.timeStamp)>400){		
					me.showTopMenu();			
				}
			}

			lastE = e;
		});

		menu.hammer().on('dragup',function(e){
			e.stopPropagation();
			
			if (lastE){
				if ((e.timeStamp - lastE.timeStamp)>400){
					me.hideTopMenu();
				}
			}

			lastE = e;
		});
	},
	_isTopMenuVisible:function(){
		return this.panes.top.hasClass('opened');
	},
	showTopMenu:function(callback,now){
		this.panes.top.addClass('opened');

		if (!now){		
			this.panes.top.transit({
				height:220
			},300,callback);
		} else {
			this.panes.top.css('height',256);
		}
	},
	hideTopMenu:function(callback,now){
		this.panes.top.removeClass('opened');
		if (!now){	
			this.panes.top.transit({
				height:64
			},300,callback);
		} else {
			this.panes.top.css('height',64);
		}
	},
	error:function(e){
		console.log(e);
	},

	_showOverlay:function(callback){
		this.panes.container.transit({
			opacity:0
		},200,callback);
		/*
		this._container.addClass('blur');

		this.panes.overlay.css('opacity',0);
		this._container.parent().append( this.panes.overlay );
		this.panes.overlay.transit({
			opacity:1,
		},200);
		*/
	},
	_hideOverlay:function(callback){
		this.panes.container.transit({
			opacity:1
		},200,callback);
		/*
		var me = this;
		if (me.panes.overlay.is(':visible')){
			
		this._container.removeClass('blur');
		this.panes.overlay.transit({
			opacity:0,
		},200,
		function(){
			me.panes.overlay.remove();
			if (typeof(callback) == 'function'){
				callback();
			}
		});

		}
		*/
	},

	getVisibleItem:function(){
		return this.panes.left.find('#page').attr('data-item');
	},
	// percentage values for window sizes
	_getWidth:function(pc){
		return pc[0]* (window.innerWidth/100)
	},
	_getHeight:function(pc){
		return pc[1]* (window.innerHeight/100)
	},
	useBigImage:function(){
		if (window.innerWidth > 900){
			return true;
		} else {
			return false;
		}
	},
	// scale the elements according to screen size changes
	scale:function() {		
		var me = this;
		this.hideTopMenu(null,true);
		var topOffset = 64;///this.panes.top.height();

		this._container.css({
			top:topOffset,
			height:window.innerHeight-topOffset
		})

		this.panes.left.css({
			top:0,
			left:0,
			width:window.innerWidth > 700 ? (window.innerWidth*0.5 < 700 ? 700 : window.innerWidth*0.5) :  (window.innerWidth > 1000 ? 1000 : window.innerWidth)
		});

		this.panes.main.css({
			width:window.innerWidth > 1000 ? 1000 : window.innerWidth,
			left:this.panes.left.width(),
			height:window.innerHeight - topOffset,
			top:0
		});

		this.panes.right.css({
			left:this.panes.left.width() + this.panes.main.width(),
			top:0
		});

		this.panes.container.css({
			width: this.panes.left.width() + this.panes.main.width() + this.panes.right.width()
		});

		try{
			this._scrollRefresh();
			this._tile();
			this.tools.scaleHeight();

			if (this._mainScroll){
				this._mainScroll.refresh();
				this._showPane('main-pane',0);
			} else {
				
				this._mainScroll = new iScroll($(this._container).attr('id'),this.mainScrollOpts);	
				this._showPane('main-pane',0);
			}
			
			if (this._listScroll){
				this._listScroll.refresh();
			} else {
				this._listScroll = new iScroll('top-menu-list-container');
			}
			

		} catch (e){
			this.error(e);
		}

		this._fire('scale');

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
		this._fire('showCategory',cat);
		
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
	_tile:function(callback){
		var container = this.panes.main_content;
		var me = this;		
		container.freetile({
			containerResize:false,
			animate:false,
			callback:function(){
				me._scrollRefresh();

				container.transit({
					opacity:1
				},600,function(){
					//me._fire('pageChangeReady');
					if (typeof(callback) == 'function'){
						callback();
					}
					me._fire('pageReady');
					me._showPane('main-pane');
					//me._hideOverlay();
				});
			}
		});
	},
	_showAtPane:function(content){
		var container = this.panes.main_content;
		var me = this;
		
		this._fire('pageChangeStart');
		//this._showOverlay();

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

			me._tile();

		})
	},
	_setMenu:function(){
		var me = this;
		var categories = this._news.getKeys('category');		
		me.tools.reset();
		each(categories,function(catg){
				catg = catg.toLowerCase();
				me.tools.addButton({
						text:catg,
						id:catg,
						span:me.getCategory(catg).length,//me._news.get('category',catg).length,
						bg:colors[catg] || colors['defaultColor'],
						spancolor:[250,250,250,0.4],
						action:function(id){
							me.showCategory(id);
						},
						target:catg.name
				});
		});
	
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
	getCategory:function(name){
		return this._news.get('category',name);
	},
	getCategories:function(){
		return this._news.getKeys('category');
	},
	_addNews:function(items){
		for (var i in items){
			if (!this._news.hasItem('title',items[i].title)){
				this._news.add(new newsItem(items[i]));
			}
		}
	},
	getOnlyDate:function(date){
		var me = this;
		//this._showOverlay();

		
		this._news.empty();
		this.getDate(date,false,function(){
			//me._hideOverlay();
			$('#date').find('h2').text(date);
		});
	},
	getLatest:function(){
		var me = this;
		this._db.getLatestDate(function(date){
			if (date){
				me.getOnlyDate(date);
			}
		});
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
		} else {

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
