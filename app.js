var express = require("express");//rest api's
var request = require("request");// use to cal the api's
var app = express();
var session = require("express-session");
const csv = require('csvtojson');//use to convert csv to json format




// var apiurl = "https://datachainblockchain.herokuapp.com";
// var weburl = "https://b-voting.herokuapp.com";

var apiurl = "http://localhost:4000";
var weburl = "http://localhost:3000";

var Loginusername = "atifahmad80";
var Loginpassword = "123"


app.use(session({ secret: 'atifahmad', resave: true, saveUninitialized: true }));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));//middleware
app.set("view engine", "ejs");

var port = process.env.PORT || 3000// rendom port chal rahi ho gi run time paa jo available ho gi os port paa chala raha hoo ga 

app.listen(port, function () {//ya function web execute 
  console.log("started sever at localhost:3000/");
})



function addBlock(data) {
  return new Promise((resolve, reject) => {//promise function result show krta ha or 
    request(
      {
        method: 'post',
        url: apiurl + '/addBlock',
        form: data,
        headers: {
          "content-type": "application/json",
        },
        json: true,
      }, (err, res, body) => {//result show krta ha promis function ka
        resolve(body);
      })
  });
}



function findBlockByQuery(data) {
  return new Promise((resolve, reject) => {
    request(
      {
        method: 'post',
        url: apiurl + '/findOneBlock',
        form: data,
        headers: {
          "content-type": "application/json",
        },
        json: true,
      }, (err, res, body) => {
        // console.log(body);
        if (body != null) {
          resolve(true);
        }
        resolve(false);
      })
  });
}


app.get("/", async (req, res) => {
  res.render("Index")
})

app.get("/ali", async (req, res) => {
  res.render("x", { data: [] })
})

app.get("/logOut", (req, res) => {
  req.session.Validation = "invalid";
  res.render("authorityLogin", { msg: "" });
})

app.get("/createPolling", function (req, res) {
  res.render("createpolling", { msg: "" })
});

app.post("/createPolling", async function (req, res) {
  var data = req.body;
  data["Loginusername"] = Loginusername;
  data["Loginpassword"] = Loginpassword;

  var collArray = ["Authority", "Candidates", "Voters", "Votes"];
  var msg = "polling created";

  request(
    {
      method: 'post',
      url: apiurl + '/CreateBlockchain',
      form: data,
      headers: {
        "content-type": "application/json",
      },
      json: true,
    }, (err, res, body) => {
      if (err) {
        console.log(err);
      }
      else {
        if (body.status == null) {
          console.log("here")
          setTimeout(() => {
            for (var i = 0; i < collArray.length; i++) {
              data["collectionName"] = collArray[i];
              request(
                {
                  method: 'post',
                  url: apiurl + '/CreateCollection',
                  form: data,
                  headers: {
                    "content-type": "application/json",
                  },
                  json: true,
                }, (err, res, body) => {
                  if (err) {
                    console.log(err);
                  }
                  else {
                    console.log("body");
                  }
                });
            }
          }, 5000);
          setTimeout(() => {
            data["collectionName"] = "Authority";
            console.log(data);
            request(
              {
                method: 'post',
                url: apiurl + '/addBlock',
                form: data,
                headers: {
                  "content-type": "application/json",
                },
                json: true,
              }, (err, res, body) => {
                if (err) {
                  console.log(err);
                }
                else {
                }
              })
          }, 10000);
        }
      }
    });


  res.render("createpolling", { msg: msg });
});



app.get("/authorityLogin", (req, res) => {
  res.render("authorityLogin", { msg: "" });
})

app.post("/authorityLogin", function (req, response) {
  var data = req.body;

  data["Loginusername"] = Loginusername;
  data["Loginpassword"] = Loginpassword;
  data["collectionName"] = "Authority";
  data["Query"] = { "data.UserName": req.body.UserName, "data.CNIC": req.body.CNIC, "data.Password": req.body.Password, }

  request(
    {
      method: 'post',
      url: apiurl + '/findOneBlock',
      form: data,
      headers: {
        "content-type": "application/json",
      },
      json: true,
    }, (err, res, body) => {
      if (err) {
        console.log(err);
      }
      else {
        if (body != null) {
          req.session.Validation = "valid";
          req.session.BLockchain = data.blockChainName;
          response.redirect("/createCandidate");

        }
        else {
          response.redirect("/createpolling");
          console.log("user not found");
        }
      }

    })


});





app.get("/createCandidate", function (req, res) {
  console.log(req.session.Validation)
  if (req.session.Validation == "valid") {
    res.render("addCandidate", { msg: "", bcName: req.session.BLockchain })
  }
  else {
    res.redirect(weburl + "/authorityLogin")
  }

});

app.post("/createCandidate", async function (req, response) {
  if (req.session.Validation == "valid") {
    var data = req.body;

    data["Loginusername"] = Loginusername;
    data["Loginpassword"] = Loginpassword;
    data["collectionName"] = "Candidates";

    var msg = "saved data";
    data["Query"] = { "data.CNIC": req.body.CNIC };
    var res = await findBlockByQuery(data)

    if (res == false) {
      delete data["Query"]
      var z = await addBlock(data)
      console.log(z);
      response.render("addCandidate", { msg: "Created", bcName: req.session.BLockchain });

    }
    else {
      console.log("Already exist")
      response.render("addCandidate", { msg: "Already exist", bcName: req.session.BLockchain });

    }
  }
  else {
    response.redirect(weburl + "/authorityLogin")
  }
});




app.post("/createCandidateFromFile", function (req, response) {
  if (req.session.Validation == "valid") {
    console.log("createCandidateFromFile");

    csv().fromFile(req.body.listfile).then(async (x) => {
      if (x[0].Name != null && x[0].CNIC != null && x[0].Contact != null) {
        for (var i = 0; i < x.length; i++) {
          var data = x[i];
          data["Loginusername"] = Loginusername;
          data["Loginpassword"] = Loginpassword;
          data["blockChainName"] = req.session.BLockchain;
          data["collectionName"] = "Candidates";

          if (x[i].CNIC.length == 13) {
            data["Query"] = { "data.CNIC": x[i].CNIC };
            var res = await findBlockByQuery(data)
            console.log(res);

            if (res == false) {
              delete data["Query"]
              var z = await addBlock(data)
              console.log(z);

            }
            else {
              console.log("Already exist")

            }
          }

        }
        response.render("addCandidate", { msg: "Created", bcName: req.session.BLockchain });
      }

      else if (x[0].Name == null) {
        console.log("Colum \"Name\" not exits ")
        response.render("addCandidate", { msg: "Colum \"Name\" not exits ", bcName: req.session.BLockchain });
      }
      else if (x[0].CNIC == null) {
        console.log("Colum \"CNIC\" not exits ")
        response.render("addCandidate", { msg: "Colum \"CNIC\" not exits ", bcName: req.session.BLockchain });
      }
      else if (x[0].Contact == null) {
        console.log("Colum \"Contact\" not exits ")
        response.render("addCandidate", { msg: "Colum \"Contact\" not exits ", bcName: req.session.BLockchain });
      }

    })



  }
  else {
    response.redirect(weburl + "/authorityLogin")
  }
});





app.get("/showCandidates", function (req, response) {
  if (req.session.Validation == "valid") {
    var data = {
      blockChainName: req.session.BLockchain,
      collectionName: 'Candidates',
    }

    data["Loginusername"] = Loginusername;
    data["Loginpassword"] = Loginpassword;
    console.log(data);
    request({
      method: 'post',
      url: apiurl + '/findAllBlock',
      form: data,
      headers: {
        "content-type": "application/json",
      },
      json: true,
    }, (err, res, body) => {
      console.log("showcandidates get");
      console.log(body);
      response.render("showCandidates", { data: body })
    });
  }
  else {
    response.redirect(weburl + "/authorityLogin")

  }
});

app.get("/createVoter", function (req, res) {
  if (req.session.Validation == "valid") {
    res.render("addVoter", { bcName: req.session.BLockchain, msg: "" })
  }
  else {
    res.redirect(weburl + "/authorityLogin")
  }
});

app.post("/createVoter", async function (req, response) {

  if (req.session.Validation == "valid") {
    var data = req.body;

    data["Loginusername"] = Loginusername;
    data["Loginpassword"] = Loginpassword;
    data["collectionName"] = "Voters";


    var msg = "saved data";
    data["Query"] = { "data.CNIC": req.body.CNIC };
    var res = await findBlockByQuery(data)

    if (res == false) {
      delete data["Query"]
      var z = await addBlock(data)
      console.log(z);
      response.render("addVoter", { msg: "Created", bcName: req.session.BLockchain });

    }
    else {
      console.log("Already exist")
      response.render("addVoter", { msg: "Already exist", bcName: req.session.BLockchain });

    }
  }
  else {
    response.redirect(weburl + "/authorityLogin")
  }

});


app.post("/createVotersFromFile", function (req, response) {
  if (req.session.Validation == "valid") {
    console.log("createVotersFromFile");

    console.log(req.body.listfile)
    csv().fromFile(req.body.listfile).then(async (x) => {
      if (x[0].Name != null && x[0].CNIC != null && x[0].Contact != null) {
        for (var i = 0; i < x.length; i++) {
          var data = x[i];
          data["Loginusername"] = Loginusername;
          data["Loginpassword"] = Loginpassword;
          data["blockChainName"] = req.session.BLockchain;
          data["collectionName"] = "Voters";

          data["Query"] = { "data.CNIC": x[i].CNIC };
          var res = await findBlockByQuery(data)
          console.log(res);

          if (x[i].CNIC.length == 13) {
            if (res == false) {
              delete data["Query"]
              var z = await addBlock(data)
              console.log(z);

            }
            else {
              console.log("Already exist")

            }
          }

        }
        response.render("addVoter", { msg: "Created", bcName: req.session.BLockchain });
      }

      else if (x[0].Name == null) {
        console.log("Colum \"Name\" not exits ")
        response.render("addVoter", { msg: "Colum \"Name\" not exits ", bcName: req.session.BLockchain });
      }
      else if (x[0].CNIC == null) {
        console.log("Colum \"CNIC\" not exits ")
        response.render("addVoter", { msg: "Colum \"CNIC\" not exits ", bcName: req.session.BLockchain });
      }
      else if (x[0].Contact == null) {
        console.log("Colum \"Contact\" not exits ")
        response.render("addVoter", { msg: "Colum \"Contact\" not exits ", bcName: req.session.BLockchain });
      }

    })

  }
  else {
    response.redirect(weburl + "/authorityLogin")
  }

});



app.get("/showVoters", function (req, response) {
  if (req.session.Validation == "valid") {
    var data = {
      blockChainName: req.session.BLockchain,
      collectionName: 'Voters',
    }

    data["Loginusername"] = Loginusername;
    data["Loginpassword"] = Loginpassword;
    console.log(data);
    request({
      method: 'post',
      url: apiurl + '/findAllBlock',
      form: data,
      headers: {
        "content-type": "application/json",
      },
      json: true,
    }, (err, res, body) => {
      console.log("showcandidates get");
      console.log(body);
      response.render("showVoters", { data: body })
    });
  }
  else {
    response.redirect(weburl + "/authorityLogin")

  }
});



app.get("/voterLogin", (req, res) => {
  res.render("voterLogin", { msg: "" });
})

app.post("/voterLogin", function (req, response) {
  var data = req.body;
  data["Loginusername"] = Loginusername;
  data["Loginpassword"] = Loginpassword;
  data["collectionName"] = "Voters";
  data["Query"] = { "data.Name": req.body.Name, "data.CNIC": req.body.CNIC, "data.Key": req.body.Key, }

  request(
    {
      method: 'post',
      url: apiurl + '/findOneBlock',
      form: data,
      headers: {
        "content-type": "application/json",
      },
      json: true,
    }, (err, res, body) => {
      if (err) {
        console.log(err);
      }
      else {
        if (body != null) {
          console.log("body")
          req.session.Validation = "voter";
          req.session.BLockchain = data.blockChainName;
          req.session.voterHash = body.hash;
          response.redirect("/castVote");
        }
        else {
          console.log("user not found");
          response.redirect(weburl + "/voterLogin")

        }
      }

    })


});



app.get("/castVote", function (req, response) {
  if (req.session.Validation == "voter") {
    var data = {
      blockChainName: req.session.BLockchain,
      collectionName: 'Candidates',
    }

    data["Loginusername"] = Loginusername;
    data["Loginpassword"] = Loginpassword;

    console.log(data);
    request({
      method: 'post',
      url: apiurl + '/findAllBlock',
      form: data,
      headers: {
        "content-type": "application/json",
      },
      json: true,
    }, (err, res, body) => {
      console.log("castvote get");
      response.render("castVote", { data: body, bcName: req.session.BLockchain })
    });
  }
  else {
    response.redirect(weburl + "/voterLogin")

  }

});

app.post("/castVote", function (req, response) {
  if (req.session.Validation == "voter") {
    var data = req.body;
    data["blockChainName"] = req.session.BLockchain;
    data["collectionName"] = "Voters";
    data["Loginusername"] = Loginusername;
    data["Loginpassword"] = Loginpassword;
    data["Query"] = { "data.CNIC": req.body.CNIC, "data.Key": req.body.key, "hash": req.session.voterHash }
    request(
      {
        method: 'post',
        url: apiurl + '/findOneBlock',
        form: data,
        headers: {
          "content-type": "application/json",
        },
        json: true,
      }, async (err, res, body) => {
        if (err) {
          console.log(err);
        }
        else {

          if (body != null) {
            console.log("Voter Find");

            var voting = {
              blockChainName: req.session.BLockchain,
              collectionName: "Votes",
              voterHash: req.session.voterHash,
              canidateHash: data.Candidate,
              Loginusername: Loginusername,
              Loginpassword: Loginpassword,
            }
            voting["Query"] = { "data.voterHash": req.session.voterHash }
            request(
              {
                method: 'post',
                url: apiurl + '/findOneBlock',
                form: voting,
                headers: {
                  "content-type": "application/json",
                },
                json: true,
              }, async (err, res, body) => {
                if (err) {
                  console.log(err);
                }
                else {

                  if (body == null) {
                    delete voting["Query"]
                    console.log(voting);
                    var z = await addBlock(voting)
                    console.log(z);
                    console.log("Not cast");
                    response.render("voterLogin", { msg: "(Vote Casted Successfully)" })

                  }
                  else {
                    console.log(body)
                    response.render("voterLogin", { msg: "(Voter Already Casted the vote)" })
                  }
                }
              }
            )

          }
          else {
            response.render("voterLogin", { msg: "(Invalid Key/CNIC)" })
          }
        }

      })
  }
  else {
    response.render("voterLogin", { msg: "" })
  }

});







