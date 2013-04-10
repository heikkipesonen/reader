function gridMenu(id,items){
	this._element = {		
		scroller:$('<div id="'+id+'" class="gridmenu-scroller"></div>'),
		container:$('<div class="gridmenu-container"></div>'),
	}

	this._element.scroller.append(this._element.container);
	this._id = id;
	this._opts = {
		minButtonWidth:128,
		cols:8,
		margin:5,
		selectMany:false
	}

	this._buttons = [];
	this._listeners = [];

	if (items){
		this.addButton(items);
	}

	this._scroll = false;
}

gridMenu.prototype = {
	clear:function(){
		for (var i in this._buttons){
			this._buttons[i].deselect();
		}
	},	
	setOption:function(key,value){
		this._opts[key] = value;
	},
	setSize:function(width,height){
		this._element.scroller.css({
			width:width,
			height:height
		});
		this.scale();
	},
	addTo:function(selector){
		$('#selector').append(this._element.scroller);
	},
	getElement:function(){
		return this._element.scroller;
	},
	findById:function(id){
		var found = false;
		for (var i in this._buttons){
			if (this._buttons[i].getId() == id){
				found = this._buttons[i];
				break;
			}
		}
		return found;
	},
	toggleButton:function(btn){
		if (typeof(btn) == 'string'){
			btn = this.findById(btn);
		}			
		
		if (btn){
			var r = btn.toggle();
			if (r && !this._opts.selectMany){
				for (var i in this._buttons){
					if (this._buttons[i]!=btn){
						this._buttons[i].deselect();
					}
				}					
			}
		}
	},
	selectButton:function(btn){
		if (!this._opts.selectMany){
			for (var i in this._buttons){
				this._buttons[i].deselect();
			}
		}
		
		if (typeof(btn) == 'string'){
			btn = this.findById(btn);
		}			
		
		if (btn){
			btn.select();
		}
	},
	eachButton:function(fn){
		for (var i in this._buttons){
			fn(this._buttons[i]);
		}
	},
	getSelected:function(){
		var res = [];
		for (var i in this._buttons){
			if (this._buttons[i].isSelected()){
				res.push(this._buttons[i]);
			}
		}
		return res;
	},
	getSelectedId:function(){
		var btns = this.getSelected();
		var res = [];
		for (var i in btns){
			res.push( btns[i].getId() );
		}
		return res;
	},
	addButton:function(btn){
		if (btn instanceof Array){
			for (var i in btn){
				this.addButton(btn[i]);
			}
		} else {
			var bt = new gridMenuButton(btn);
			var me = this;
			
			bt.on('click',function(id,btn){
				me._fire('click',id,bt);				
			});

			this._buttons.push(bt);
			this._element.container.append(bt.getElement());
		}
	},
	setButtonBackground:function(rgba){
		for (var i in this._buttons){
			this._buttons[i].setBackgroundColor(rgba);
		}
	},
	scale:function(){
		var total_width = this._element.container.innerWidth(),
			cols = this._opts.cols,
			btn_width = total_width / cols;

			console.log(btn_width)

		if (btn_width < this._opts.minButtonWidth){
			btn_width = this._opts.minButtonWidth;

			var rmdr = total_width % btn_width;
			
			if (rmdr != 0 ){
				var overflow = rmdr*btn_width;
				console.log(overflow);
				var w = (btn_width / total_width);

					
			}
		}

		for (var i in this._buttons){
			this._buttons[i].setSize(btn_width,128,this._opts.margin);
		}

		if (this._scroll){
			this._scroll.destroy();
		}
		this._scroll = new iScroll(this._id);
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

function gridMenuButton(data){
	this._element = {
		container:$('<div class="gridmenu-button"></div>'),
		textcontainer:$('<div class="gridmenu-button-textcontainer"></div>'),
		smalltext:$('<span class="small-text"></span>'),
		largetext:$('<span class="large-text"></span>')
	}

	if (data){
		this._id = data._id || createUUID();
		this.setSmallText(data.smalltext);
		this.setLargeText(data.largetext);
	}
	this._listeners = [];
	this._element.container.append(this._element.textcontainer.append(this._element.smalltext).append(this._element.largetext));

	var me = this;
	this._element.container.hammer().on('tap',function(e){
		me._fire('click',me._id,me);
	});
}

gridMenuButton.prototype = {
	getId:function(){
		return this._id;
	},
	select:function(){
		this._element.container.addClass('selected');
	},
	toggle:function(){
		this._element.container.toggleClass('selected');
		return this.isSelected();
	},
	deselect:function(){
		this._element.container.removeClass('selected');
	},
	isSelected:function(){
		return this._element.container.hasClass('selected');
	},
	getElement:function(){
		return this._element.container;
	},
	setSmallText:function(text){
		this._element.smalltext.text(text);
	},
	setLargeText:function(date){
		this._element.largetext.text(date.substring(0,5));
	},
	getBackgroundColor:function(){
		return this._bgColor;
	},
	setBackgroundColor:function(rgba){
		this._bgColor = rgba;
		this._element.container.css({
			'background-color':'rgba('+rgba.join(',')+')'
		});
	},
	setSize:function(w,h,margin){
		if (margin){
			w=w-(2*margin);
			h=h-(2*margin);
		}
		this._element.container.css({
			width:w,
			height:h,
			display:'inline-block',
			margin:margin || 0
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