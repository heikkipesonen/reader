	var itemBuilder = {
		build:function(items,opts){

			var me = this;
			var e = [];

				each(items,function(item){
					var type = newsParser.testSize(item);
					var opt = opts[type];

					if (type == 'b' && opts.bisbig == true){
						item.important = true;
					}

					var ob =me[opt](item);

					if (opts.tap){
						
						ob.hammer().on('tap',function(){
							opts.tap($(this).attr('id'));
						});
					}
					e.push(ob);
				});

			
			return e;

		},
		buildList:function(items){
			var list = $('<li class="item-container"></li>');

			for (var i in items){
				var e = this.s(items[i])
				list.append(e);
			}

			return list;
		},
		s:function(data){
			var e = $('<li border-color:'+colors.getColor(data.category)+'" class="clickable smallListItem listItem"></li>');
			e.attr('id',data._id);
			e.attr('data-action','showItem');
			e.attr('data-target',data._id);

			if (data.content){
				if (data.content.length > 0){
					e.append('<div class="list-img-container"><img src="'+IMG_URL +'thumb/'+ data.content[0].name+'" class="small-image"/></div>');
					e.addClass('has-image');
				}
			}
			var c = $('<div class="textcontainer"></div>');
			
			c.append('<h4>'+data.title+'</h4>');
			//e.append('<span>'+getItemDate(data.pubdate)+'</span>')

			e.append(c);

			return e;
		},
		b:function(data,size){
			var e = $('<div class="clickable item tile bigItem" data-action="showItem"  data-target="'+data._id+'"></div>');

			e.attr('id',data._id);

			if (data.important == true){
				
				e.addClass('important');
			}

			if (data.content){
				if (data.content.length > 0){
					var image= data.content[0];

					e.append('<div class="img-container"><img src="'+IMG_URL + image.name+'" class="big-image"/></div>');
					e.addClass('has-image');				

					if (image.sizes[0][1] > image.sizes[0][0]){
						e.addClass('thin');
					} else {
						e.addClass('wide');
					}

					e.find('.img-container')
						.append('<h2 style="background-color:'+colors.getColor(data.category)+'">'+data.title+'</h2>')
						//.append('<div class="image-text" style="background-color:'+colors.getColor(data.category)+'">'+image.text+'</div>')
						.append('<span class="date">'+getItemDate(data.pubdate)+'</span>')
						.append('<span style="background-color:'+colors.getColor(data.category)+'"class="category">'+data.category+'</span>');					
				}


			} else {
					
					e
						.addClass('no-image')
						.append('<h2>'+data.title+'</h2>')
						.append('<span class="date">'+getItemDate(data.pubdate)+'</span>')
						.append('<span style="background-color:'+colors.getColor(data.category)+'"class="wide category">'+data.category+'</span>')
						.append('<div class="textcontainer"><p>'+newsParser.shortenText(data)+'</p></div>');

			}


			return e;
		},
		fullView:function(id){
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