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

	this._mainPaneScroll=false;	// main pane, the tile display scroll
	this._listeners =[]; // event listeners registered for rupu

}

rupu.prototype = {
	// start rupu
	// container is the element for rupu run in
	start:function(container){
		var me = this;
		this._container = $(container);
		this._db = new dblink({
								url:'http://cdb.ereading.metropolia.fi/reader',
								designDocument:'news'
							});

		this._news = new itemStore();
		

		this.on('load',function(){
			me._sortItems();
			me._showPane('main-pane');
		});

		$(window).resize(function(){
			clearTimeout(me._onscale);

			me._onscale = setTimeout(function(){
				me.scale();			
			},200);
		});

		//this._initTopMenu();
		//this._showPane('main-pane',0);
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
	
	error:function(e){
		console.log(e);
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
		

	},
	// scroll to certain pane with _mainScroll-horizontal scroll
	_showPane:function(id,time){
		if (time==undefined){
			time=300;
		}

		/*
		if (this._mainScroll){
			this._mainScroll.scrollToElement('#'+id,time);
			this._fire('showPane',id);
		}*/
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
		
		var container = this._panes.main;
		var me = this;		
		
		container.freetile({
			containerResize:false,
			animate:false,
			callback:function(){
				me._scrollRefresh();
				me._showPane('main-pane');

				container.transit({
					opacity:1
				},300,function(){
					//me._fire('pageChangeReady');
					if (typeof(callback) == 'function'){
						callback();
					}
					me._fire('pageReady');
				});
			}
		});
		
	},
	_showAtPane:function(content){
		
		var container = this._panes.main;
		var me = this;
		
		this._fire('pageChangeStart');
		//this._showOverlay();

		container.transit({
			opacity:0
		},200,function(){

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
