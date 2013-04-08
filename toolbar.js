function button(id,text,span){
	this._element = {
		container:$('<div id="'+id+'" class="selectable clickable toolbar-button"></div>'),
		text:$('<h4 class="button-text"></h4>'),
		span:$('<span class="button-large-text"></span>')
	}

	this._colors = {};
	this._id = id;

	this._element.container.append(this._element.span).append( this._element.text);

	if (text){
		this.setText(text);
	}

	if (span){
		this.setSpan(span);
	}
}

button.prototype = {
	select:function(){
		this._element.container.addClass('selected');
	},
	deSelect:function(){
		this._element.container.removeClass('selected');
	},
	setAction:function(action,target){
		this._element.container.hammer().on('tap',function(e){
			action(target);
		});
		//this._element.container.attr('data-action',action);
		//this._element.container.attr('data-target',target);
	},
	getWidth:function(){
		return this._element.container.outerWidth(true);
	},
	setWidth:function(w){
		this._element.container.css('width',w);
	},
	getHeight:function(){
		return this._element.container.height();
	},
	setHeight:function(h){
		this._element.container.css({
			height:h
		});
	},
	getElement:function(){
		return this._element.container;
	},
	getText:function(){
		return this._element.text.text();
	},
	getSpan:function(){
		return this._element.span.text();
	},
	setBackgroundColor:function(rgba){
		this._colors.background = rgba;
		this._element.container.css({
			'background-color':'rgba('+rgba.join(',')+')',
			'border-color':'rgba('+rgba.join(',')+')'
		});
	},
	setTextColor:function(rgba){
		this._colors.text = rgba;
		this._element.text.css('color','rgba('+rgba.join(',')+')');
	},
	setSpanColor:function(rgba){
		this._colors.span = rgba;
		this._element.span.css('color','rgba('+rgba.join(',')+')');
	},
	setText:function(text){
		this._element.text.text(text);
	},
	setSpan:function(text){
		this._element.span.text(text);
	},
	getColor:function(from){
		return this._colors[from];
	}
}


function toolbar(id){
	this._element = {
		container:$('<div id="'+id+'" class="toolbar-container"></div>'),
		scroll:$('<div class="toolbar-scroll"></div>'),
		buttonContainer: $('<div class="toolbar-button-container"></div>'),
		//panel:$('<div class="toolbar-panel"></div>')
	}
	this._id = id;
	this._listeners = [];


	this._element.container.append(this._element.scroll.append(this._element.buttonContainer));//.append(this._element.panel ) ;

	this._opts = {
		buttonMinWidth:128,
		buttonMinHeight:128
	}

	this._buttons = [];
	this._scroller = false;
}

toolbar.prototype = {
		reset:function(){
			this._element.buttonContainer.empty();
			this._buttons = [];
		},
		setPanelColor:function(rgba){
			this._element.container.css('background-color','rgba('+rgba.join(',')+')');
			//this._element.panel.css('background-color','rgba('+rgba.join(',')+')');
		},
		selectButton:function(id){
			var me = this;
			this.buttons(function(btn){
				if (btn._id == id){
					btn.select();
					var e = btn.getElement();
					me.setPanelColor( btn.getColor('background') );
				} else {
					btn.deSelect();
				}
			});
		},
		setSize:function(size){
			this.setHeight(size[1]);
			this.setWidth(size[0]);
		},
		setHeight:function(h){
			this._element.container.css('height',h);
		},
		getHeight:function(){
			return this._element.container.height();
		},
		getElement:function(){
			return this._element.container;
		},
		addTo:function(selector){
			$(selector).append(this.getElement());
		},
		getButton:function(id){
			for (var i in this._buttons){
				if (this._buttons[i]._id == id){					
					return this._buttons[i];
				}
			}
		},
		addButton:function(data){
			var btn = new button(data.id,data.text,data.span);
			if (data.bg){
				btn.setBackgroundColor(data.bg);
			}
			if (data.spancolor){
				btn.setSpanColor(data.spancolor);
			}
			if (data.textcolor){
				btn.setTextColor(data.textcolor);
			}
			if (data.action){
				btn.setAction(data.action,data.id);
			}

			this._element.buttonContainer.append( btn.getElement() );
			this._buttons.push(btn);
		},
		setScroll:function(){
			if (this._scroller){
				this._scroller.destroy();
			}
			this._scroller = new iScroll(this._element.container.attr('id'),{hScrollbar:false,vScrollbar:false});
		},
		setWidth:function(w){
			this._element.container.css('width',w);
		},
		setScrollWidth:function(w){
			this._element.scroll.css('width',w);
		},
		getScrollWidth:function(){
			return this._element.scroll.width();
		},
		setScrollHeight:function(h){
			this._element.scroll.css('height',h);
		},
		getScrollHeight:function(){
			return this._element.scroll.height();
		},
		getWidth:function(){
			return this._element.container.width();
		},
		getButtonsWidth:function(){
			var total = 0;
			for (var i in this._buttons){
				total += this._buttons[i].getWidth();
			}
			return total;
		},
		getButtonsHeight:function(){
			var total = 0;
			for (var i in this._buttons){
				total+=this._buttons[i].getHeight();
			}
			return total;
		},
		buttons:function(fn){
			for (var i in this._buttons){
				fn(this._buttons[i],i);
			}
		},
		scaleHeight:function(){
			this._element.container.addClass('vertical');
			this._element.container.removeClass('horizontal');

			var h = this.getHeight(),
			 	total = this.getButtonsHeight(),
			 	minHeight = this._opts.buttonMinHeight,
			 	me = this;


			 this.buttons(function(btn){
				btn.setWidth('100%');
				var cr = btn.getHeight() / total,
					nr = cr*h;

					if (nr > me._opts.buttonMinHeight){
						btn.setHeight(nr);
					} else {
						btn.setHeight(me._opts.buttonMinHeight);
					}

			 });

			if (this.getButtonsHeight() > h){
				this.setScrollHeight( this.getButtonsHeight()+5 );
			}
			this.setScroll();

		},
		scaleWidth:function(){
			this._element.container.addClass('horizontal');
			this._element.container.removeClass('vertical');

			var w = this.getWidth();
			var total = this.getButtonsWidth();
			var minWidth = this._opts.buttonMinWidth;			
			var me = this;


			this.buttons(function(btn){
				btn.setHeight('100%');
				var cr = btn.getWidth() / total,
					nr = cr*w;

					if (nr > me._opts.buttonMinWidth){
						btn.setWidth(nr);
					} else {
						btn.setWidth(me._opts.buttonMinWidth);
					}
			});
	

			if (this.getButtonsWidth() > w){
				this.setScrollWidth( this.getButtonsWidth()+5 );
			} 
			this.setScroll();
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