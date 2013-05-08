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
		this._panes = [];
		this._swPanes = {
			left:false,
			right:false,
			mid:false
		};
		this._container = $(container);
		this._main = $('<div id="rupu-container"></div>');
		this._container.html(this._main);

		this._db = new dblink({
								url:'http://cdb.ereading.metropolia.fi/reader',
								designDocument:'news'
							});

		this._news = new itemStore();
		

		this.on('load',function(){
			this._sortItems();
			
			var ct = me._news.getKeys('category');
			for (var i in ct){
				var e = $('<div class="pane" name="'+ct[i]+'"></div>');
				this._panes.push( e );		
			}

		});

		$(window).resize(function(){
			clearTimeout(me._onscale);
			me._onscale = setTimeout(function(){
				me.scale();			
			},200);
		});

		this.scale();
		this._fire('start');		
	},
	showCategory:function(name){

	},
	_getIndex:function(name){
		var found = false;

		for (var i in this._panes){
			if (this._panes[i].attr('name') == name){
				found = i;
				break;
			}
		}
		return found;
	},
	_getPane:function(name){
		var found = false;
		for (var i in this._panes){
			if (this._panes[i].attr('name') == name){
				found = this._panes[i];
				break;
			}
		}
		return found;
	},
	_getPrevPane:function(name){
		var i = this._getIndex(name);
		if (i!=false){
			if (i<0 && this._panes[i-1] != undefined){
				return this._panes[i-1];
			} else {
				return this._panes[this._panes.length-1];
			}
		} else {
			return false;
		}
	},
	_getNextPane:function(name){
		var i = this._getIndex(name);
		if (i!=false){
			if (this._panes.length > i && this._panes[i+1] != undefined){
				return this._panes[i+1];
			} else {
				return this._panes[0];
			}
		} else {
			return false;
		}
	},
	// show category of items by category name	
	showItems:function(items){
		var me = this;				
		var e = [];

		this._sortSet(items);
		
		each(items,function(item){
			//e.push(item.getTile());

		});
		

		
		this._fire('showItems',items);
	},	
	error:function(e){
		console.log(e);
	},
	getVisibleItem:function(){
		return this.panes.left.find('#page').attr('data-item');
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
		this._main.css({
			width:window.innerWidth,
			height:window.innerHeight,
			top:0,
			left:0,
			position:'absolute'
		});
	},
	_scrollRefresh:function(){
		if (this._mainPaneScroll && this._mainPaneScroll!=undefined){
			this._mainPaneScroll.destroy();
		}
		
		this._mainPaneScroll = new iScroll('main-pane',this.iscrollOpts);						
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
	_sortItems:function(){
		this._news.sort(function(a,b){
			if (a.category > b.category){
				return 1;
			} else {
				return -1;
			}
		});
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
	getLatest:function(){
		var me = this;
		this._db.getLatestDate(function(date){
			if (date){
				me._news.empty();
				me.getDate(date,false,function(){					
					$('#date').find('h2').text(date);
				});
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
				this._listeners['all'][i].call(this,evt,data,e);
			}
		}
		if (this._listeners[evt]!=undefined){
			for (var i in this._listeners[evt]){
				if (typeof(this._listeners[evt][i])=='function'){
					this._listeners[evt][i].call(this,data,e);
				}
			}			
		}
	},
	off:function(evt){
		delete this._listeners[evt];
	}	
}
