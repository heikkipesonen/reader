<?php
	date_default_timezone_set('Europe/Helsinki');
	
	// PLACE YOUR URL HERE
	$url =  'MRSS-URL';
	
	
	
	function microtime_float()
	{
	    list($usec, $sec) = explode(" ", microtime());
	    return ((float)$usec + (float)$sec);
	}
	
	$start_time = microtime_float(); 
	$items = array();
	
	
	try{
		$fileContents= file_get_contents($url);
		$fileContents = str_replace(array("\n", "\r", "\t"), ' ', $fileContents);
		$fileContents = str_replace('media:', 'media_', $fileContents);
		$fileContents = str_replace('dc:creator', 'author', $fileContents);
		$fileContents = trim(str_replace('"', "'", $fileContents));
		$simpleXml = simplexml_load_string($fileContents);
	
	} catch (Exception $e){
		error($e);
	}

	if ($simpleXml){
		$paper = array(
			'title'=>(string)$simpleXml->channel->title,
			'timestamp'=>microtime_float(),
			'description'=>(string)$simpleXml->channel->description,
			'language'=>(string)$simpleXml->channel->language,
			'image'=>array(
				'url'=>(string)$simpleXml->channel->image->url,
				'link'=>(string)$simpleXml->channel->image->link,
				'title'=>(string)$simpleXml->channel->image->title
			)
		);
		foreach ($simpleXml->channel->item as $item){
			$images = array();
			foreach ($item->media_content as $content){
				if ($content->attributes() != 'false' && $content->attributes()){
					
					try{
						$image = array(
							//'url'=>(string)$content->attributes(),
							'title'=>(string)$content->media_title,
							'text'=>(string)$content->media_description,
							'author'=>(string)$content->media_credit,
							'url'=>(string)$content->attributes(),
							'name'=>basename((string)$content->attributes())
						);

						$images[] = $image;
					} catch (Exception $e){
						error($e);

					}
				}
			}

			$newsItem = array(
				'_id'=>(string)$item->guid,
				'title'=>(string)$item->title,
				'text'=>(string)$item->description,
				'category'=>(string)$item->category,
				'priority'=>(string)$item->comments,
				'pubdate'=>strtotime( (string)$item->pubDate ),
				'readtime'=>microtime_float(),
				'author'=>(string)$item->author,
				'guid'=>(string)$item->guid,
				'source'=>$paper['title'],
				'image'=>$images
			);


			


			
			$items[] = $newsItem;
		}	
		$end_time = microtime_float();


		

		$data = json_encode(array(
							'status'=>'ok',							
							'source'=>$paper,
							'start'=>$start_time,
							'end'=>$end_time,
							'took'=>$end_time-$start_time,
							'data'=> $items
						));
		
		echo json_encode($data);
		
	} else {		
		echo json_encode(array('status'=>'error','message'=>'invalid data'));
	}

	function error($e){		
		echo json_encode(array('status'=>'error','message'=>$e->getMessage()));
	}

	function parseText($text){	
		$result = preg_replace("/<(.|\n)*?>/",' ', $text);
		return $result;
	}
	
?>
