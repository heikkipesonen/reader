

function error(e,message){

}

function saveData(){

	localStorage.news = JSON.stringify({
		date:Date.now(),
		data:NEWS
	}); 
}

function checkData(callback){
	var data = loadData();

	if (data && LOADED && USE_CACHE){
		if ((data.date - Date.now()) > RF_DELAY){
	
			if (callback && typeof(callback) == 'function'){
				getNews(function(e){
					callback(e);
				});
			}

			return false;
		} else {
			return true;
		}
	} else {
		if (callback && typeof(callback) == 'function'){
			getNews(function(e){
				callback(e);
			});
		}
		return false;
	}
}

function loadData(){
	if (localStorage.news){
		return JSON.parse(localStorage.news);
	} else {
		return false;
	}
}

function getMenu(){
	if (LOADED){
		var items = getCategories();
		var menu = $('<ul class="menu" />');

		if (items){
			for (var i in items){

				var e = $('<li>');
				e.append('<p>'+items[i].name+'</p>');
				e.append('<span>'+items[i].items+'</span>');
				e.attr('data-action','getcategory');
				e.attr('data-target',items[i].name);
				e.addClass('action selectable');

				menu.append(e);
			}

			return menu;
		} else {
			error('categories not loaded');
			return false;
		}
	} else {
		error('items not loaded before trying to make menu');
		return false;
	}
}


function parseResults(data){
	var results = [];
	if (data.rows){
		for (var i in data.rows){
			results.push(data.rows[i].value);
		}
	}
	return results;
}

function getDateString(days){
	

	var dt = new Date();
	var td = Date.now() - (days * 24 * 60 * 60 *1000);
	
	dt.setTime(td);
	var m = dt.getMonth()+1;
	
	if (m < 10){
		m = 0+''+m;
	}
	//dt.setDate( dt.getDate() - days);
	var d = dt.getDate();

	if (d < 10){
		 d = 0+''+d;
	}
	var dts = dt.getFullYear() + '.'+ m +'.'+ d;
	
	console.log(dts);
	return dts;
}


function getTimeKey(from,to){
	var key = 0;
	if (from || to){
		var now =  parseInt(Date.now() / 1000);
		var td = (from*60*60);
		key = now-td;		

	} else {
		var now =  parseInt(Date.now() / 1000);
		var td = (hrs*60*60);
		key = now-td;		
	}
	return key;
}

function getDataUrl(startTime,endTime){
	var url = 'http://cdb.ereading.metropolia.fi/reader/_design/news/_view/strdate';

	if (startTime || endTime){
		url += '?';
	}


	url += '&startkey="'+getDateString(1)+'"';

	return url;
}

function getNews(callback,opts){
	showLoad();
	if (opts == undefined){
		opts = {};
	}

	if (checkData() && !opts.force){
		var data = loadData().data;
		NEWS = data;
		LOADED = true;
		hideLoad();
		callback(data);

	} else {

//'http://ereading.metropolia.fi/puru/getnews.php'
		


		$.getJSON(getDataUrl(48,0),function(e){
			var results = {};

			if (e.rows.length > 0){
				results = parseResults(e);
				if (results){
					NEWS = results;
					saveData(NEWS);
					LOADED = true;
				} else {
					if (error){
						error('getNews error');
					}
				}

				hideLoad();	
					
				if (callback){
					callback(results);
				} else {
					if (error){
						error('no callback at getnews');
					}
				}
			} else {
				hideLoad();
				if (error){
					error('load failure');
				}
				if (callback){
					callback(false);
				}
			}
		});
		
	}
}



function getCategoryPreviews(limit){
	if (!limit){
		limit = 4;
	}
	var results = {};
	var categories = getCategories();

	for (var i in categories){
		var items = getCategory(categories[i].name);
		var c = 0;

		results[categories[i].name] = {};

		while (c < limit){
			if (items[c]){
				results[categories[i].name][items[c].id] = items[c];
			}
			c++;
		}
	}
	
	return results;
}

function getCategories(){
	var list = [];
	var count = {};

	if (checkData()){

		for (var i in NEWS){
			var name = NEWS[i].category.toLowerCase();

			//if (!isInArray(list,name)){
			//	list.push(name);
			//} else {
		
			if (count[name]){
				count[name]++;
			} else {
				count[name] = 1;
			}
			//}

		}
		for (var i in count){
			list.push({
				name:i,
				items:count[i]
			});
		}

		return list;
	} else {
		return false;
	}
}

function getCategory(name){
	var results = [];
	if (typeof(name) == 'object' &&  name.name){
		name = name.name;
	}
	if (typeof(name) == 'string'){

		if (checkData()){
			for (var i in NEWS){
				if (typeof(NEWS[i].category) == 'string'){				
					if (NEWS[i].category.toLowerCase() == name.toLowerCase()){
						results.push(NEWS[i]);
					}
				}
			}
		}

	}
	if (results.length > 0){
		return results;
	} else {
		return false;
	}
}