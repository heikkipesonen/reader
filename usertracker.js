function userTracker(_rupu,username){
	var me = this;
	this._rupu = _rupu;	
	this.bind();

	
	this._db = new ajaxQueue({url:'usertracker.php',dataType:'json',type:'POST'});
	
	this._userData = {
		'user_id':username,		
		'start_time':Date.now(),
		'window':[window.innerWidth,window.innerHeight],
		'screen':[window.screen.width,window.screen.height],
		'media':window.styleMedia.type,
		'type':navigator.userAgent,
		'vendor':navigator.vendor,
		'latitude':0,
		'longitude':0
	}

	if (navigator.geolocation){
		navigator.geolocation.getCurrentPosition(function(e){
			me._userData.latitude = e.coords.latitude;
			me._userData.longitude = e.coords.longitude;
			me._setUser();
		});
	} else {
		this._setUser();
	}

}

userTracker.prototype = {
	_setUser:function(){
		if (!this._userData.user_id){			
			if (!localStorage.getItem('rupu_id')){
				localStorage.setItem('rupu_id',getId());
			}
			this._userData.user_id = localStorage.getItem('rupu_id');
		}
		
		localStorage.setItem('rupu_id',this._userData.user_id);

		this._db.add({
			login:this._userData.user_id,
			userdata:this._userData
		});
	},
	bind:function(rupu){
		var me = this;
		if (rupu) this._rupu = rupu;
		this._rupu.on('tracker',function(e){
			e.time = Date.now();
			e.user_id = me._userData.user_id;
			e.session_id = me._userData.session_id;
			e.latitude = me._userData.latitude;
			e.longitude = me._userData.longitude;
			me._db.add({data:e});
		});
	}
}









function ajaxQueue(args,oncomplete){	
	this._args = args;
	this._reqs = [];
	this._result = [];
	this._busy = false;
	this._callback = oncomplete || function(){};
}

ajaxQueue.prototype = {
	add:function(data){
		this._reqs.push(data);
		this._ready();
	},
	_error:function(e){
		if (typeof(this.onError)=='function'){
			this.onError(e);
		} else if (e.responseText){
			console.log(e.responseText);			
		} else console.log(e);
	},
	_ready:function(e){
		if (this._reqs.length > 0 && !this._busy){
			this._send(this._reqs.shift());
		} else if (this._reqs.length == 0){			
			this._callback.call(this, this._result);
			this._result = [];
		}
	},
	_send:function(data){
		var me = this;
		this._busy = true;
		$.ajax({
			url:this._args.url,
			dataType:this._args.dataType,
			type:this._args.type,
			data:data,
			success:function(e){
				me._busy = false;				
				if (e.ok == true || e.ok == 'true'){
					me._result.push(e);
					me._ready();
				} else {
					me._error(e);
				}
			},
			error:function(e){
				me._busy = false;
				me._error(e);
				me._ready();
			}
		});
	}
}
