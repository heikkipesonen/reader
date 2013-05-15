var SMALLIMG_URL = 'http://ereading.metropolia.fi/puru/img/small/'; // image base url
var FULLIMG_URL = 'http://ereading.metropolia.fi/puru/img/'; // image base url
//var FULLIMG_URL ='http://tablet.kp24.fi/data/attachment/';
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
			var pages = [];
			
			each(ct,function(category){
				var items = me.getCategory(category);
				var pgcontainer = $('<div class="news-category-page-container" style="background-color:'+colors.getColor(category,1)+';"></div>');
				var pg = $('<div class="news-category-page" id="'+category+'"></div>');
				
				pgcontainer.append('<div class="category-header"><h2>'+category+'</h2></div>');
				pgcontainer.append(pg);
				me._sortSet(items);

				var count = 0;

				each(items,function(item){
					var e = item.getTile();
					pg.append( e );
					count++;

					e.addClass('row-'+count);

					if(count == 3){
						count=0;
					}
					
					e.hammer().on('tap',function(evt){						
						me.showItem($(this).attr('id'));
					});

					
				});

				
				pages.push(pgcontainer);

			});

			this._container.switcher({
				paneWidth:'80%',
				offset:-1,
				touches:1,
				items:pages,
				preventDefault:true,
				onchange:function(newPane){					
					var me = this;
					this.find('').imagesLoaded(function(){						
						setTimeout(function(){
							me.find('.news-category-page').isotope();
						},100);
					});
				}
			});
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
	showItem:function(id){
		console.log(id);
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
