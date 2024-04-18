const express = require('express');
const app = express();
app.set('view engine',  'ejs');
app.use(express.json());
const path = require("path")
app.use(express.static(path.join(__dirname, 'public')));
const knex = require('knex')({
  client: 'oracledb',
  connection: {
    user: 'abhinash',
    password: 'abhinash',
    connectString: 'localhost/XE'
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await knex('USERS').select('*');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get("/",(req,res)=>{
     res.render("Dashboard")
})
app.get("/gallery",(req,res)=>{
  res.render("gallary")
})
app.get("/login",(req,res)=>{
  res.render("login")
})
app.get("/signup",(req,res)=>{
  res.render("signup")
})

app.post("/login",async(req, res)=>{
  const {MEMBER_ID, password}=req.body;
  console.log(req.body)
  
    let user = (await knex('UNION_MEMBER')).find(u => u.MEMBER_ID==MEMBER_ID);
    if(!user || user.PASSWORD!=password)
    {
      let error = 'invalid credential or user not exists'
      res.json({'error': error})

    }

    
    else{
      // set jwt token

         const token = jwt.sign({"user": user.MEMBER_ID}, 'arsh')
         res.cookie('token',token);
        res.json({'token': token})
    }
  
})