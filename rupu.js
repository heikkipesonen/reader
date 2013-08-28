var //smallImageURL = 'http://ereading.metropolia.fi/puru/img/small/',
	//smallImageURL = 'http://ereading.metropolia.fi/puru/img/',
	//imageURL = 'http://ereading.metropolia.fi/puru/img/',
	parserURL = 'parser.php';


var rupu = function(){
	// iscroll common options
	this.iscrollOpts = {
		momentum:true,
		vScrollbar:false,
		hScrollbar:false,
		SnapThreshold:500,
		lockDirection:true		
	}

	// elements for rupu to use
	this.panes = {	
		menu_tip : $('<div id="menu-tip"></div>'),
		top: $('<div id="top-bar"></div>'),
		left : $('<div id="left-pane" class="pane"></div>'),
		right : $('<div id="right-pane" class="pane"></div>'),
		menu_container : $('<div id="menu-container"></div>'),
		menu_container_scroller : $('<div id="menu-container-scroller"></div>'),
		main : $('<div id="main-pane" class="pane"></div>'),
		main_scroller : $('<div id="main-pane-scroller"></div>'),
		main_content : $('<div id="main-pane-content"></div>'),
		container : $('<div id="main"></div>')
	}

	this._mainScroll = false; // iscroll for main element, the horizontal scroller
	this._pageScroll=false;	// page, item display scroller
	this._menuScroll=false;
	this._mainPaneScroll=false;	// main pane, the tile display scroll
	this._listeners =[]; // event listeners registered for rupu

	this._border = 0;
	this._gutter = 16;
	this._lang = 'fi';
	//this._maintitle = '';
	//this._subtitle = '';
}

rupu.prototype = {
	// start rupu
	// container is the element for rupu run in
	start:function(container){
		var me = this;

		this._dummy = $('<div id="dummy" />');
		this._items = [];
		
		this.panes.container				
				.append(this.panes.left.append(this.panes.left_newscontainer))
				.append(this.panes.main.append(this.panes.main_scroller.append(this.panes.main_content)))
				.append(this.panes.right.append(this.panes.menu_container_scroller.append(this.panes.menu_container)));
				
		$(container).append(this.panes.container);
		this.panes.main.append(this.panes.menu_tip);

		this._container = $(container);

		this.panes.container.css({
			position:'absolute',
			left:'0px',
			top:'0px'
		});

		this.panes.container._translate(0,0);

		this.panes.left.hammer().on('tap',function(){
			me._showPane('main-pane');
			me._fire('tracker',{'action':'close_article','event_type':'tap','data':me.getVisibleItem()});
			me._fire('hideItem',me.getVisibleItem());
		});

		this._lastEvent = false;

		this.panes.menu_tip.hammer().on('tap',function(){
			me._showPane('right-pane');
		});

		this.panes.container.on('mousedown',function(e){
			me._lastEvent = false;
		});


		this.panes.container.hammer().on('touchstart',function(e){
			me._lastEvent = false;
		});

		this.panes.container.hammer().on('dragleft dragright',function(e){
			var dist = 0;
			if (me._lastEvent){
				dist = e.gesture.deltaX- me._lastEvent.gesture.deltaX;
			}
			me._drag(dist);
			me._lastEvent = e;
		});

		this.panes.container.hammer().on('touchend',function(e){
			me._checkPosition();
		});

		this.panes.container.on('mouseup',function(e){
			me._checkPosition();
		});

		this.overlay(true);
		
		this.on('load',function(){
			me._loaded = true;
			me.scale();
			me.showMenu();
			me._showPane('right-pane');
			me.overlay();

			me._scrollRefresh();
			me._setTitle();
		});

		$(window).resize(function(){
			me.overlay(true);
			clearTimeout(me._onscale);

			me._onscale = setTimeout(function(){				
				me.scale();
				me.overlay(false);
				
				me._fire('tracker',{'action':'window_resize','event_type':'','data':[window.innerWidth,window.innerHeight].join(',')});
				me._fire('resize',[window.innerWidth,window.innerHeight]);
			},200);
		});
		
		this._fire('start');	
		this._getData();

		me._fire('tracker',{'action':'restart','event_type':'page reload','data':''});
	},
	_setTitle:function(){		
		document.title = this._source.title || '';
	},
	loading:function(show){
		var me = this;
		if (!this._loading){
			this._loading= $([
				'<div id="loading-overlay">',
				'</div>'
			].join('')).css({
				position:'fixed',
				top:'0px',
				left:'0px',
				width:'100%',
				height:'100%',
				opacity:'0'
			});			
		}
		if (show){
			if (!this._hasLoadingOverlay){
				this._container.append(this._loading);
				this._hasLoadingOverlay = true;
				this._loading.animate({
					opacity:1,
				},100);
			}

		} else {
			if (this._hasLoadingOverlay){
				this._loading.animate({
					opacity:0,
				},100,function(){
					me._hasLoadingOverlay = false;
					me._loading.remove();
				})
			}
		}		
	},
	overlay:function(show){
		var me = this;
		if (!this._overlay){
			var title = 'reader';

			if (this._source){
				title = this._source.title;
			}

			this._overlay= $([
				'<div id="overlay">',
				'<h1 class="main-title">',title,'</h1>',
 				'<h3 class="sub-title">',dateParser.getDate(Date.now()),'</h3>',
 				'<img src="css/load-icon.png" alt="" class="clock-icon" />',
				'</div>'
			].join('')).css({
				position:'fixed',
				top:'0px',
				left:'0px',
				width:'100%',
				height:'100%',
				opacity:'0'
			});
		}

		if (show){
			if (!this._hasOverlay){
				this._container.append(this._overlay);
				this._hasOverlay = true;
				this._overlay.animate({
					opacity:1,
				},100);
			}

		} else {
			if (this._overlay){
				this._overlay.animate({
					opacity:0,
				},500,function(){
					me._hasOverlay = false;
					me._overlay.remove();
				})
			}
		}
	},
	error:function(e){
		//if (e.stack) console.log(e.stack);
		this._fire('tracker',{'action':'error','event_type':'error','data':e.message});
		
		this.overlay(true);
		this._overlay.append('<h3 class="error">something is not quite right just now. try again later :(</h3>')
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
		this.panes.container._translate(0,0);
		var topOffset = 0;///this.panes.top.height();

		this._container.css({
			top:0,
			height:window.innerHeight
		})

		this.panes.left.css({
			top:0,
			left:0,
			width:window.innerWidth > 900 ? (window.innerWidth*0.5 < 900 ? 900 : window.innerWidth*0.5) :  (window.innerWidth > 1000 ? 1000 : window.innerWidth)
		});

		this.panes.main.css({
			width:window.innerWidth,//*0.9 < 700 ? window.innerWidth : window.innerWidth*0.9,
			left:this.panes.left.width(),
			height:window.innerHeight - topOffset,
			top:0
		});


		this.panes.right.css({
			width:window.innerWidth,//*0.9 < 700 ? window.innerWidth : window.innerWidth*0.9,
			left:this.panes.left.width() + this.panes.main.width(),
			top:0
		});

		this.panes.container.css({
			top: topOffset,
			width: this.panes.left.width() + this.panes.main.width() + this.panes.right.width()
		});


		this._leftPos = 0;
		this._mainPos = -this.panes.left.outerWidth(true);

		var offset = (window.innerWidth - this.panes.right.outerWidth(true)) /2;

		//console.log(offset);

		this._rightPos = -((this.panes.left.outerWidth(true) + this.panes.main.outerWidth(true))-offset);



		var w = this.panes.main_content.innerWidth();

		var s1 = (w),
			s2 = (w- ((1*this._gutter) - (4*this._border)) )/2,
			s3 = (w- ((2*this._gutter) - (6*this._border)) )/3,
			s4 = (w- ((3*this._gutter) - (8*this._border)) )/4;

		this._itemWidth = s1 < 900 ? s1 : s2 < 500 ? s2 : s3 > 450 ? s4 : s3;
		this._itemWidth--;

		var mw = this.panes.menu_container.innerWidth();		

		var ms2 = (mw - 1*this._gutter) / 2,
			ms3 = (mw - 2*this._gutter) / 3,
			ms4 = (mw - 3*this._gutter) / 4,
			ms5 = (mw - 4*this._gutter) / 5;
 

		this._tileWidth = ms2 < 300 ? ms2 : ms3 < 300 ? ms3 : ms4 < 300 ? ms4 : ms5;
		this._tileWidth--;

		try{
			this._scrollRefresh();
			this._tile();

		} catch (e){
			this.error(e);
		}		
		this._fire('scale');
		this._showPane(this._currentPane);
	},
	_animate:function(distance,callback){	
		var lastStep = 0,
		me = this;
		

		this._dummy.stop();
		this._dummy.css('width','100px');

		this._dummy.animate({
			width:0
		},{
			step:function(step){
				var cdist = (step-100) * (distance/100);					
				me._drag( -(cdist-lastStep) );
				
				lastStep = cdist;

			},
			duration:300,
			complete:callback
		});
	},
	_drag:function(distance){
		var pos = this.panes.container._getPosition().left;
		this.panes.container._translate(pos+distance,0);		
	},
	_checkPosition:function(){
		var me = this;
		var position = this.panes.container._getPosition().left,

			diffToMain = this._mainPos-position,
			diffToRight = this._rightPos-position,
			diffToLeft = this._leftPos-position;
	
		var panToright = Math.abs( diffToRight )< (this.panes.right.outerWidth(true)/2) ? true : position < this._rightPos;
		var panToLeft = Math.abs( diffToLeft ) < (this.panes.left.outerWidth(true)/2) ? true : position > this._leftPos;

		if (panToright){
			if (this._currentPane != 'right-pane'){		
				me._fire('tracker',{'action':'show_menu','event_type':'drag','data':'right-pane'});
			}
			this._showPane('right-pane');
		} else if (panToLeft){
			if (this._currentPane != 'left-pane'){
				me._fire('tracker',{'action':'open_article','event_type':'drag','data':this.getVisibleItem()});
				//me._fire('tracker',{'action':'show_pane','event_type':'drag','data':'left-pane'});
			}

			this._showPane('left-pane');
		} else {
			if (this._currentPane == 'left-pane'){
				me._fire('tracker',{'action':'close_article','event_type':'drag','data':this.getVisibleItem()});
			}
			if (this._currentPane != 'main-pane'){
				me._fire('tracker',{'action':'open_category','event_type':'drag','data':this._currentCategory});
			}
			this._showPane('main-pane');
		}

		if (this._lastEvent){
			if (this._lastEvent.gesture.velocityX > 2.0 || Math.abs(this._lastEvent.gesture.deltaX > 150)){
				if (this._lastEvent.gesture.direction == 'left'){
					if (this._currentPane == 'left-pane'){//Math.abs(diffToLeft)<Math.abs(diffToMain)){						
						//me._fire('swipeTo','main-pane');
						if (this._currentPane == 'left-pane'){
							me._fire('tracker',{'action':'close_article','event_type':'swipe','data':this.getVisibleItem()});
						}
						if (this._currentPane != 'main-pane'){
							me._fire('tracker',{'action':'open_category','event_type':'swipe','data':this._currentCategory});
						}
						this._showPane('main-pane');
					} else {
						if (this._currentPane != 'right-pane'){
							me._fire('tracker',{'action':'close_category','event_type':'swipe','data':this._currentCategory});
							me._fire('tracker',{'action':'show_menu','event_type':'swipe','data':'right-pane'});
						}

						this._showPane('right-pane');
					}

				} else if (this._lastEvent.gesture.direction == 'right'){
					
					if (this._currentPane == 'right-pane'){//Math.abs(diffToRight)<Math.abs(diffToMain)){
						//me._fire('swipeTo','main-pane');
						if (this._currentPane != 'main-pane'){
							me._fire('tracker',{'action':'open_category','event_type':'swipe','data':this._currentCategory});
						}
						this._showPane('main-pane');
					} else {
						//me._fire('swipeTo','left-pane');
						if (this._currentPane != 'left-pane'){
							me._fire('tracker',{'action':'open_article','event_type':'swipe','data':this.getVisibleItem()});
							me._fire('tracker',{'action':'show_pane','event_type':'swipe','data':'left-pane'});
						} 

						
						
						this._showPane('left-pane');
					}
				}
			}
		}
	},
	// scroll to certain pane with _mainScroll-horizontal scroll
	_showPane:function(id,callback){
		var position = 0;
		if (id == 'main-pane'){
			if (this._currentCategory){
				position = this._mainPos;//-this.panes.left.outerWidth(true);				
			} else {
				this._showPane('right-pane');
				return;
			}
		} else if (id == 'left-pane'){
			if (this.panes.left.children().length > 0){
				if (this._currentPane == 'right-pane'){
					this._showPane('main-pane');
					return;
				}
				position = 0;
			} else {
				this._showPane('main-pane');
				return;
			}
		} else if (id == 'right-pane'){
			if (this._currentPane == 'left-pane'){
				this._showPane(main-pane);
				return;
			}

			position = this._rightPos;//-(this.panes.left.outerWidth(true) + this.panes.right.outerWidth(true));
		}

		var diff = -this.panes.container._getPosition().left + position;

		this._currentPane = id;

		this._animate(diff,callback);
		this._fire('showPane',id);
	},	
	_sortSet:function(items){
		items.sort(function(a,b){		
				return a.priority - b.priority;			
		});

		items.sort(function(a,b){
			if (a.hasImage() && !b.hasImage()){
				return -1;
			} else if (!a.hasImage() && b.hasImage){
				return 1;
			} else {
				return 0;
			}
		})
	},
	showMenu:function(){
		if (this._loaded){
			var list = this._getCategoryNames(),
				me = this,
				e = this.panes.menu_container,

				brand = $([
					'<div id="brand-display">',
						'<h2 class="title">',this._source.title,'</h2>',
						//'<h4>testiversio',/*this._source.title,*/'</h4>',
						'<h2 class="datetime">',dateParser.getDate(this._source.timestamp*1000),'</h2>',
						//'<img src="',this._source.image.url,'" alt="" />',
					,'</div>'

			].join(''));

			e.append(brand);

			for (var i in list){
				if (list[i]){
					var items =this.getCategory(list[i]);
					this._sortSet(items);

					var img = '';

					for (var v in items){
						if (items[v].hasImage()){

							img = '<img src="'+items[v].getImage()+'"/>';
							break;
						}
					}	
					
					var c = $('<div id="'+list[i]+'" class="category tile">'+img+'<h4 style="background-color:'+colors.getColor(list[i],0.7)+'">'+list[i]+'</h4></div>')
					
					c.hammer().on('tap',function(){
						me.showCategory($(this).attr('id'));
						me._fire('tracker',{'action':'open_category','event_type':'menubutton_tap','data':$(this).attr('id')});
					});

					c.css({
						'background-color':colors.getColor(list[i]),
					})

					e.append(c);

				}
			}

			//this.panes.menu_tip.css('background-color',colors.getColor('categories',1));
			this._container.css('background-color',colors.getColor('categories',1));
			this._menuScroll = new iScroll(this.panes.right.attr('id'),this.iscrollOpts);
			this._tile();
		}
	},	
	// show category of items by category name
	showItems:function(items,sort){
		var me = this,
			found = false,
			e = [];

		if (!sort){
			this._sortSet(items);
		}
	
		each(items,function(item){
			e.push(item.getTile());
		});

		//e.unshift( $('<div class="category-title"><h2>'+this._currentCategory+'</h2></div>') );
		
		this._showAtPane(e);
		this._fire('showItems',items);
	},
	showCategory:function(cat){		
		cat = cat.toLowerCase();
		this._currentCategory = cat;

		var items = this.getCategory(cat);

		this.showItems(items);


		this._container.css('background-color',colors.getColor(cat,1));
		
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
			var e = this._getItem(id).getFull();
				
			container.imagesLoaded(function(){
				
				container.transit({
					opacity:0,
				},200,function(){
					container.html(e);
					/*
					container.find('h1, h2, h3, h4').each(function(){
						$(this).addClass('hyphenate text').attr('lang',me._lang);
					});
					*/
					//Hyphenator.run();

					if (scrollTo!=false){
						me._showPane('left-pane');
					}

					if (me._pageScroll){
						me._pageScroll.destroy();
					}

					container.find('img').each(function(){						
						if ($(this).outerHeight() > $(this).outerWidth()){							
							container.find('.news-page').addClass('tall-image');
						}						
					});

					container.transit({opacity:1});
					
					me._pageScroll = new iScroll('page',me.iscrollOpts);
					me._fire('showItem',id);
				});
			});
		}
	},
	_scrollRefresh:function(){
		if (this._mainPaneScroll && this._mainPaneScroll!=undefined){
			this._mainPaneScroll.destroy();
		}
		if (this._menuScroll){
			this._menuScroll.refresh();
		}

		if (this._pageScroll){
			this._pageScroll.refresh();
		}

		this._mainPaneScroll = new iScroll('main-pane-scroller',this.iscrollOpts);						
	},

	_tile:function(callback){
		var container = this.panes.main_content;
		var menu = this.panes.right.find('#menu-container');
		
		var me = this;		
		var gutter = me._gutter,
			border = me._border;

		if (menu[0]){

			menu.imagesLoaded(function(){
					menu.find('.tile').each(function(){							
						$(this).css({
							'width':me._tileWidth,
							'height':me._tileWidth,							
						});
					});


					var mp = new Packery(menu[0],{				
						gutter:gutter
					});

					me._scrollRefresh();	
			});
		}		

		container.imagesLoaded(function(){

			container.find('.tile, .category-title').each(function(){
				$(this).css({
					'width':me._itemWidth,
				});

				if ($(this).hasClass('category-title')){
					$(this).css('width',container.innerWidth());
				}

				if ($(this).width() >= 0.8*container.innerWidth()){
					$(this).addClass('one-row');					
				} else {
					$(this).removeClass('one-row');
				}
				if ($(this).find('.newsitem-imagecontainer').height() > $(this).find('.newsitem-imagecontainer').width()){
					$(this).addClass('tall-image');
					if ($(this).hasClass('one-row')){
						$(this).find('.image-item-header-container').css('background-color',colors.getColor($(this).attr('category'),1));
					}
				}

				if (parseInt( $(this).attr('priority') ) < 6 && $(this).hasClass('has-image')){
					$(this).addClass('double-size');
					$(this).find('.image-item-header-container').css('background-color',colors.getColor($(this).attr('category'),1));

					if (window.innerWidth >= me._itemWidth*2){
						$(this).css('width',(me._itemWidth*2)+gutter+border);
					}
				} else if (parseInt( $(this).attr('priority') )> 6 && (me._itemWidth/2)>190 && $(this).hasClass('no-image') && container.find('.tile').length > 4){
					var w = (me._itemWidth - gutter)/2 > 300 ? (me._itemWidth - 2*gutter)/3 : (me._itemWidth - gutter)/2;
					$(this).css('width',Math.floor( (w) - (border*2)-1 ))
							.addClass('small-item');
				}
			});

			var p = new Packery(container[0],{				
				gutter:gutter
			});

			me._scrollRefresh();	


			container.transit({
				opacity:1
			},500,function(){
				//Hyphenator.run();
				me.loading(false);
			});
		});
	},
	_showAtPane:function(content){
		var container = this.panes.main_content;
		var me = this;
		this._fire('pageChangeStart');
		
			me._showPane('main-pane',function(){
								
					container.transit({
						opacity:0
					},200,function(){
				
						container.empty();
					
						each(content,function(item){
							/*
							item.find('p, h1, h2, h3, h4').each(function(){
								$(this).addClass('hyphenate text').attr('lang',me._lang);
								
							});
							*/
							
							item.hammer().on('tap',function(){
								if ($(this).hasClass('newsitem')){
									me.showItem($(this).attr('id'));	
									me._fire('tracker',{'action':'open_article','event_type':'tap','data':$(this).attr('id')});
								} else if ($(this).hasClass('category')){
									me.showCategory($(this).attr('id'));
								}
							});
							container.append(item);
						});

						me._tile();

					});
			});	
	},
	_getCategories:function(){
		var categories = {};
		for (var i in this._items){
			if (categories[this._items[i].category]){
				categories[this._items[i].category]++;
			} else {
				categories[this._items[i].category] = 1;
			}
		}

		this._categories = categories;
		return categories;
	},
	_getCategoryNames:function(){		
		this._getCategories();
		var result = [];
		for (var i in this._categories){
			//if (i.toLowerCase()!='etusivu'){
				result.push(i);
			//}
		}
		return result;
	},
	getCategory:function(name){
		var result = [];
		name = name.toLowerCase();
		
		for (var i in this._items){
			if (this._items[i].category.toLowerCase() == name){
				result.push(this._items[i]);
			}
		}
		return result;
	},
	_makeFrontPage:function(){
		var frontPage = [];
		this._items.sort(function(a,b){
			return a.priority - b.priority;
		})


		for (var i = 0; i<20; i++){
			if (this._items[i] && this._items[i] instanceof newsitem){
				if (this._items[i].category.toLowerCase() != 'etusivu'){
					frontPage.push(this._items[i]);
				}
			}
		}

		frontPage.sort(function(a,b){
			if (a.hasImage()){
				return -1;
			} else if (b.hasImage()){
				return 1;
			} else {
				return 0;
			}
		});
		

		return frontPage;
	},
	_getData:function(){
		var me = this;		
		var d = Date.now();

			$.ajax({
				url:parserURL,
				dataType:'JSON',
				success:function(e){
					var rs = JSON.parse(e);
					
					if (rs.status == 'ok'){						
						for (var i in rs.data){
							me._items.push( new newsitem(rs.data[i]));
						}								
						me._source = rs.source;
						me._lang = rs.source.language;

						me._getCategories();
						
						var d2 = Date.now(),
							time = d2 - d;

						me._fire('load',me._items);
						me._fire('tracker',{'action':'xml-load','event_type':'data load','data':time});
					} else {
						me._error(rs);
					}
				},
				error:function(e){
					me.error(e);
				}
			});
	},
	_getItem:function(id){
		var found = false;
		for (var i in this._items){
			if (this._items[i]._id == id){
				found = this._items[i];
				break;
			}
		}

		return found;
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
