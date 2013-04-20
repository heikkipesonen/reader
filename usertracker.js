function userTracker(_rupu){
	this._rupu = _rupu;	
	this._data = {};
}

userTracker.prototype = {
	bind:function(){
		/*
				hideItem
				showItem

				showCategory
		*/
		var me = this;
		this._rupu.on('showItem',function(id){
			me.showItem(id);
		});
		
		this._rupu._mainPaneScroll.on('scrollToElement',function(el){
			if ($(el).attr('id') == ''){
				
			}
		});
	},


	showItem:function(id){
		var t = Date.now();

		if (this._data[id]!=undefined){
			this._data[id].count++;			
			this._data[id].start = t;
		} else {
			this._data[id]={
				count:1,
				duration:0,
				start:t,
				end:false
			}
		}
	}
}