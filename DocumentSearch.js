require('dotenv-extended').load();

var restify = require('restify');
var builder = require('botbuilder');
var cognitiveservices = require('botbuilder-cognitiveservices');

var ArrayList = require('arraylist');
var unique = require('array-unique');
var path = require('path');
var Excel = require('exceljs');
var xlsx = require('xlsx');

module.exports = [
    function (session, args, next) {
        console.log('DocumentSearch dialog starts');
		var entities = args;
		var j;
		
		if (typeof(entities) !== "undefined" && entities.length > 0) {
			
			
				
				var values = entities[0].resolution.values;
			
				var docURL = [];
				var _watch = false;
				var isPromiseComplete = false;
				var filename = path.join(__dirname,'document_list.xlsx');
				
					var wb = new Excel.Workbook();
					wb.xlsx.readFile(filename).then(function() {
						var entity = entities[0];
						for (j in values) {
							console.log('in for loop values');
							var category = entity.type;
							var documentName = values[j];
							
							console.log('category: '+category);
							console.log('documentName: '+documentName);		
							var sh = wb.getWorksheet(category);
							if(sh != null) {
								sh.eachRow(function(row, rowNumber) {
									var rowvalue = typeof(row.getCell(1).value) === "string" ? row.getCell(1).value : row.getCell(1).value.text;
									if (rowvalue.toLowerCase() == documentName.toLowerCase()) {
										console.log("document located in excel successfully");
										var file_url = row.getCell(2).value.hyperlink ? row.getCell(2).value.hyperlink : row.getCell(2).value;
										var file_type = row.getCell(3).value;
										console.log('file_type:' + file_type);
										var img_link = 'img/docicon.png';
										switch (file_type) {
											case "pdf":
												img_link = 'img/pdficon.png';
												break;
											case "excel":
												img_link = 'img/xlicon.png';
												break;
											case "doc":
												img_link = 'img/wordicon.png';
												break
											case "ppt":
												img_link = 'img/ppticon.png';
												break
											default:
												img_link = 'img/docicon.png';
												break;
										}
									var file_link = "[![]("+img_link+")"+documentName+"]("+file_url+")";
									
									docURL.push(file_link);
									console.log('docURL: ' + docURL);
									}
									
								});	
							}
							//if(parseInt(j) === (values.length - 1)){
								isPromiseComplete = true;
							//}
						}
					
					}).catch(function(err){ console.error('promise threw err : %s',err) } );
				
				var interval = setInterval(function() {
					if ( _watch !== isPromiseComplete ) {
						if(docURL.length == 0) {
							builder.Prompts.text(session, 'No matching document found. Please rephrase your required document search.');
						}
						
						console.log('docURL: '+docURL);
						var value = null;
						var doc = session.dialogData.doc = {
							value : docURL ? docURL : null
						}
						console.log('doc: '+doc);
						/*if (!doc.value.length) {
							session.send('Oops! No Matching document Found.');
						} else {*/
							next();
						//}
						isPromiseComplete = false;
						console.log('isPromiseComplete? '+ isPromiseComplete)
						if(parseInt(j) === (values.length - 1)) {
							clearInterval(interval);
						}
						
					}
				}, 500);	
		}
		else if (!entities.length) {
			session.replaceDialog('DocumentSearch', { reprompt: true });
		}
	},
	
	function (session, results, next) {
        
		var doc = session.dialogData.doc;
        
        // Send confirmation to user
		console.log('doc: ' + doc);
		console.log(typeof(doc.value));
        
		if (doc.value.length>1) {
			var strmsg = doc.value.toString();
			var finalmsg = strmsg.split(",").join("<br />");
			session.send("You may select your required document from the following - "+"<br />"+finalmsg);
			//session.endDialog();
		}
		else if (doc.value.length==1) {
			session.send("You have selected" + "<br />" + "<br />" + doc.value.toString());
			//session.endDialog();
		}
		session.endDialog();
		setTimeout(function(){session.beginDialog('DocSearchFallback');}, 5*1000);
		
	}
	]