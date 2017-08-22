var express = require('express');
	var morgan = require('morgan');
	var path = require('path');
	var Pool = require('pg').Pool;
	var crypto = require('crypto');
	var bodyParser = require('body-parser');
	var session = require('express-session');
	
var config = {
    user: 'rkkhamrana',
    database: 'rkkhamrana',
    host:'http://db.imad.hasura-app.io',
    //http://db.imad.hasura-app.io
    port: '5432',
    password:db-rkkhamrana-72147
    //password: process.env.DB_PASSWORD
};
	
	var app = express();
	app.use(morgan('combined'));
	app.use(bodyParser.json());
	app.use(session({
	    secret: 'someRandomValue',
	    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30},
	    resave: true,
	    saveUninitialized: true
	}));
	
	function createTemplate(data){
	    var title=data.title;
	    var heading=data.heading;
	    var date=data.date;
	    var content=data.content;
	    
	    var htmlTemplate=`
	        <html>
	        <head>
	            <title>
	                ${title}
	            </title>
	            <meta name="viewport" content="width-device-width, initial-scale=1" />
	            <link href="/ui/style.css" rel="stylesheet" />
	        </head>
	        <body>
	            <div class="container">
	                <div>
	                    <a href="/">Home</a>
	                </div>
	                <hr/>
	                <h3>
	                   ${heading}
	                </h3>
	                <div>
	                    ${date.toDateString()}
	                </div>
	                <div>
	                    ${content}
	                </div>
	                <hr/>
	                <h3>Comments</h3>
	            <div>
	                <input type='text' id='comment' placeholder='Comment'/>
	                <br><br>
	                <input type='submit' value='Post' id='comment_btn'/>
	            </div>
	            <hr/>
	            </div>
	        </body>
	    </html>`;
	    
	    return htmlTemplate;
	}
	
	/*app.get('/a%20b', function (req,res){
	   res.send("Hello"); 
	});*/
	
	app.get('/', function (req, res) {
	  res.sendFile(path.join(__dirname, 'ui', 'index.html'));
	});
	
	function hash (input, salt) {
	    //How do we create a hash?
	    var hashed = crypto.pbkdf2Sync(input, salt, 100000, 512, 'sha512');
	    return ['pbkdf2', '100000', salt, hashed.toString('hex')].join('$');
	}
	
	app.post('/login', function (req, res) {
	    //username, password
	    var username = req.body.username;
	    var password = req.body.password;
	    
	    pool.query('select * from "user" where username = $1', [username], function (err, result){
	        if(err) {
	            res.status(500).send(err.toString());
	        } else {
	            if(result.rows.length === 0){
	                res.status(403).send("Username/ Password is invalid");
	            }else{
	                //Match the password
	                var dbString = result.rows[0].password;
	                var salt = dbString.split("$")[2];
	                var hashedPassword = hash(password, salt);
	                if(hashedPassword == dbString){
	                    
	                    //set the session
	                    req.session.auth = {userId: result.rows[0].id};
	                    
	                    res.send("Sucessfully Logged in!");
	                } else{
	                    res.status(403).send("Username/ Password is invalid");
	                }
	            }
	        }
	    });
	});
	
	app.get('/hash/:input', function (req, res) {
	   var hashedString = hash(req.params.input, 'this-is-salt-changed');
	   res.send(hashedString);
	});
	
	app.post('/create-user', function (req, res) {
	    //username, password
	    var username = req.body.username;
	    var password = req.body.password;
	    
	    pool.query('select count(*) from "user" where username = $1', [username], function (err, result){
	        if(err) {
	            res.status(500).send(err.toString());
	        } else {
	            var count = parseInt(result.rows[0].count);
	            if(count > 0){
	                res.send("Username already taken. Choose another Username");
	            }else if(count === 0){
	                var salt = crypto.randomBytes(128).toString('hex');
	                var dbString= hash(password, salt);
	                pool.query('INSERT INTO "user" (username, password) VALUES ($1, $2)', [username, dbString], function (err, result){
	                    if(err) {
	                        res.status(500).send(err.toString());
	                    } else {
	                        res.send("User sucessfully created");
	                    }
	                });
	            }
	        }
	    });
	});
	
	app.get('/check-login', function (req, res) {
	   if (req.session && req.session.auth && req.session.auth.userId) {
	       
	       pool.query('select username from "user" where id=$1', [req.session.auth.userId.toString()], function(err, result){
	           if(err) {
	               res.status(500).send(err.toString());
	           }
	           else {
	               if(result.rows.length === 0) {
	                   res.status(400).send("You are not logged in!");
	               } else {
	                    res.send(result.rows[0].username);
	               }
	           }
	       });
	       
	   } else {
	       res.status(400).send("You are not logged in!");
	   }
	});
	
	app.get('/logout', function (req, res) {
	    delete req.session.auth;
	    res.send("You are logged out!");
	});
	
	var pool = new Pool(config);
	app.get('/test-db', function (req, res) {
	    //make a select request
	    //return a response with the results
	    pool.query("SELECT * from test", function(err, result) {
	        if(err) {
	            res.status(500).send(err.toString());
	        } else {
	            res.send(JSON.stringify(result));
	        }
	    });
	});
	
	var counter=0;
	app.get('/counter', function (req,res) {
	   counter = counter + 1;
	   res.send(counter.toString());
	});
	
	var names=[];
	app.get('/submit-name', function (req, res) { // URL: /submit-name?name=xxx
	    //Get the Name from the request
	    var name= req.query.name; 
	    
	    names.push(name);
	    // JSON; Javascript Object Notation
	    res.send(JSON.stringify(names));
	});
	
	var articles=[];
	app.get('/get-articles', function(req, res){
	    pool.query("select title, heading, date from article", function(err, result) {
	        if(err) {
	            res.status(500).send(err.toString());
	        } else {
	            for(var i=0; i<result.rows.length; i++){
	                var article = result.rows[i];
	                articles.push(article);
	            }
	            res.send(JSON.stringify(articles));
	        }
	    });
	});
	
	app.get('/articles/:articleName',function(req,res){
	     
	    pool.query("SELECT * FROM article WHERE title = $1", [req.params.articleName] , function (err, result) {
	        if(err) {
	            res.status(500).send(err.toString());
	        } else {
	            if(result.rows.length === 0) {
	                res.status(404).send('article not found');
	            } else {
	                var articleData = result.rows[0];
	                res.send(createTemplate(articleData));
	            }
	        }
	    });
	});
	
	app.get('/ui/style.css', function (req, res) {
	  res.sendFile(path.join(__dirname, 'ui', 'style.css'));
	});
	
	app.get('/ui/madi.png', function (req, res) {
	  res.sendFile(path.join(__dirname, 'ui', 'madi.png'));
	});
	
	app.get('/ui/main.js', function (req, res) {
	  res.sendFile(path.join(__dirname, 'ui', 'main.js'));
	});
	
	// Do not change port, otherwise your app won't run on IMAD servers
	// Use 8080 only for local development if you already have apache running on 80
	
	var port = 80;
	app.listen(port, function () {
	  console.log(`IMAD course app listening on port ${port}!`);
	});

