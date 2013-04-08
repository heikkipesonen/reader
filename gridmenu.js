function gridMenu(id){
	this._element = {		
		scroller:$('<div id="'+id+'" class="gridmenu-scroller"></div>'),
		container:$('<div class="gridmenu-container"></div>'),
	}

	this._element.scroller.append(this._element.container);

	this._opts = {
		minButtonWidth:128,
		cols:8		
	}

	this._buttons = [];
}

gridMenu.prototype = {
	addTo:function(selector){
		$('#selector').append(this._element.scroller);
	},
	getElement:function(){
		return this._element.scroller;
	},
	addButton:function(btn){
		if (btn instanceof Array){
			for (var i in btn){
				this.addButton(btn[i]);
			}
		} else {
			this._buttons.push( new gridMenuButton(btn) );
		}
	},
	scale:function(){
		var total_width = this._element.container.innerWidth(),
			cols = this._opts.cols,
			btn_width = total_width / cols,


		if (btn_width < this._opts.minButtonWidth){
			btn_width = this._opts.minButtonWidth;

			var rmdr = total_width % btn_width;
			
			if (rmdr != 0 ){
				var overflow = rmdr*btn_width;
				console.log(overflow);
				var w = (btn_width / total_width);

					
			}
		}
	}
}

function gridMenuButton(data){
	this._element = {
		container:$('<div class="gridmenu-button"></div>'),
		textcontainer:$('<div class="gridmenu-button-textcontainer"></div>'),
		text:$('<span class="text"></span>'),
		date:$('<span class="date"></span>')
	}

	if (data){
		this.setText(data.count);
		this.setDate(data.date);
	}

	this._element.container.append(this._element.textcontainer.append(this._element.text).append(this._element.date));
}

gridMenuButton.prototype = {
	getElement:function(){
		return this._element.container;
	},
	setText:function(text){
		this._element.text.text(text);
	},
	setDate:function(date){
		this._element.date.text(date);
	},
	setSize:function(w,h){
		this._element.css({
			width:w,
			height:h
		});
	}
}