function newsItem(data){
	for (var i in data){
		this[i] = data[i];
	}	
}

newsItem.prototype = {
	getListItem:function(){
		
		var e = $('<li border-color:'+colors.getColor(this.category)+'" class="clickable smallListItem listItem"></li>');
		e.attr('id',this._id);
		e.attr('this-action','showItem');
		e.attr('this-target',this._id);

		if (this.content){
			if (this.content.length > 0){
				e.append('<div class="list-img-container"><img src="'+IMG_URL +'thumb/'+ this.content[0].name+'" class="small-image"/></div>');
				e.addClass('has-image');
			}
		}
		var c = $('<div class="textcontainer"></div>');

		c.append('<h4>'+this.title+'</h4>');
		//e.append('<span>'+getItemDate(this.pubdate)+'</span>')

		e.append(c);

		return e;
	},
	getNewsItem:function(){
		var data = this._data;
		var e = $('<div class="clickable item tile bigItem" data-action="showItem"  data-target="'+this._id+'"></div>');

		e.attr('id',this._id);

		if (this.important == true){
			
			e.addClass('important');
		}

		if (this.content){
			if (this.content.length > 0){
				var image= this.content[0];

				e.append('<div class="img-container"><img src="'+IMG_URL + image.name+'" class="big-image"/></div>');
				e.addClass('has-image');				

				if (image.sizes[0][1] > image.sizes[0][0]){
					e.addClass('thin');
				} else {
					e.addClass('wide');
				}

				e.find('.img-container')
					.append('<h2 style="background-color:'+colors.getColor(this.category)+'">'+this.title+'</h2>')
					//.append('<div class="image-text" style="background-color:'+colors.getColor(this.category)+'">'+image.text+'</div>')
					.append('<span class="date">'+getItemDate(this.pubdate)+'</span>')
					.append('<span style="background-color:'+colors.getColor(this.category)+'"class="category">'+this.category+'</span>');					
			}


		} else {
				
				e
					.addClass('no-image')
					.append('<h2>'+this.title+'</h2>')
					.append('<span class="date">'+getItemDate(this.pubdate)+'</span>')
					.append('<span style="background-color:'+colors.getColor(this.category)+'"class="wide category">'+this.category+'</span>')
					.append('<div class="textcontainer"><p>'+newsParser.shortenText(data)+'</p></div>');

		}


		return e;		
	},
	getFull:function(){	
		var data = this._data;		
		var item = newsParser.getItem(id);
		var size = newsParser.testSize(item);

		var c = $('<div id="page" data-item="'+id+'" class="scale fullheight pagecontainer"></div>')
		
		var scroll = $('<div id="page-scroll" class="page-scroll"></div>');
		var e = $('<div class="news-page"></div>');

		if (size == 'b'){
			c.addClass('has-image');
			var imgCont = $('<div class="imagecontainer"></div>');
			

			//each(item.content,function(img){
				img = item.content[0];

				var im = $('<img src="'+IMG_URL+img.name+'" alt="" />');
				imgCont.html(im);
				
				if (img.sizes[0][1] > img.sizes[0][0]){
					im.addClass('thin');
					c.addClass('thin-image');
				} else {
					c.addClass('wide-image');
					im.addClass('wide');
				}
			//});

			imgCont.append('<h1 style="background-color: '+colors.getColor(item.category)+'" class="news-header">'+item.title+'</h1>');
			e.append(imgCont)
		} else {
			c.addClass('no-image');
			e.addClass('no-image');
			var head = $('<div class="header"  ></div>');
				head.append('<h1 style="color: '+colors.getColor(item.category)+'" class="news-header">'+item.title+'</h1>');

			e.append(head);
		}

		
		var body = $('<div class="textcontainer"></div>');
			body.append(item.text);



		
		c.append( scroll.append( e.append(body).append('<div class="clear"></div>') ) );

		return c; 
		
	}
}