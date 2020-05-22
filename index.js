const image = require("./static/camera.js");
const path = require("path");
const express =  require('express');
const fs =  require('fs');
const mime =  require('mime');
const bodyparser = require('body-parser');
const database = require('node-couchdb');
const multer = require('multer');

const dbName = "mydb";
const viewUrl = "_design/all_images/_view/all";

var storage = multer.diskStorage({
	destination: './static/images/',
	filename: function(req, file, cb){
		cb(null, file.fieldname+ Date.now()+path.extname(file.originalname))
	}
}); 

const upload = multer({
	storage: storage,
	limits: {fileSize: 10000000},
	fileFilter: function(req, file, cb){
		checkFileType(file, cb);
	}
}).single('image');

function checkFileType(file, cb){
	const filetypes = /jpeg|jpg|png|/;
	const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
	const mimetype =filetypes.test(file.mimetype);

	if(mimetype && extname){
		return cb(null, true);
	}else{
		cb('Error: Images');
	}
}

app = express();
const couchdb = new database();

function fetchDatabases(){
	couchdb.listDatabases().then((dbs)=>{
		console.log(dbs);
	});
}

function insertImg(image_name){
	couchdb.uniqid().then((ids)=>{
		const id = ids[0];

		couchdb.insert(dbName, {
			image_name:image_name
		}).then((data, headers, status)=>{
			console.log(data);
		},(err)=>{
			res.send(err);
		});
	});
}


app.use('/public', express.static(path.join(__dirname,'static')))
app.set('view engine','ejs');
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json({limit: '50mb'}));

app.get('/', (req,res)=>{
	//res.sendFile(path.join(__dirname,'static','camera.html'));
	res.render('camera');
});

app.get('/pictures', (req,res)=>{
	couchdb.get(dbName, viewUrl).then((data, headers, status)=>{
		res.render('pictures',
			{images: data.data.rows,
			 res: data.data});
	},(err)=>{
		res.send(error);
	});
});

app.post('/pictures/delete/:id', (req, res)=>{
	const id = req.params.id;
	const rev = req.body.rev;
	const image = req.body.name;

	fs.unlink('static/images/'+image, (err, success)=>{
		if(err){
			console.log("can't remove the image");
		}else{
			console.log("succesfully removed file");
		}
	});
	
	couchdb.del(dbName,id,rev).then((data, headers, status)=>{
	   res.redirect('/pictures');
	},(err)=>{
		res.send(err);
	});
});

app.post('/upload', (req,res)=>{
	upload(req, res, (err)=>{
		if(err){
			res.render('camera',{message : "error while uploading"});
		}else{
			if(req.file == undefined){
				res.render('camera',{message : "no file selected"});
			}else{
				res.render('camera',{message : "picture succesfully uploaded"});
				insertImg(req.file.filename);
			}
		}
	});
});

function random(ln){
	var result ="";
	var character ="1234567890";
	characterln=character.length;
	for(var i=0; i<ln;i++){
		result+=character.charAt(Math.floor(Math.random()*characterln));
	}
	return result;
}

const save = async(req,res,next)=>{
	var matches = req.body.img.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
	let response = {};
	if(matches.length!==3){
		return new Error('Invalid input string');
	}
	response.type = matches[1];
	response.data = new Buffer.from(matches[2], 'base64');
	let decodedImg = response;
	let imageBuffer = decodedImg.data;
	let type = decodedImg.type;
	let extension = mime.extension(type);
	let fileName = 'image.'+extension;
  
  	if(fs.existsSync('./static/images/'+fileName)){
  		try{
  			fileName = 'image'+random(3)+'.'+extension;
  			insertImg(fileName);
		    fs.writeFileSync('./static/images/'+fileName,imageBuffer, 'utf8');
		    return res.send({status:"success"});
	    }catch(e){
		    next(e)
	    }
  	}else{
  		try{
  			insertImg(fileName);
			fs.writeFileSync('./static/images/'+fileName,imageBuffer, 'utf8');
			return res.send({status:"success"});
		}catch(e){
			next(e)
		}
  	}
}

app.post('/',save);

app.listen(3000, (err, success)=>{
	if(err){
		console.log('error connection');
	}
	console.log('subscriber connected');
});