require('dotenv').config();
const express=require('express');const cors=require('cors');const path=require('path');
const api=require('./src/routes');const authRoutes=require('./src/routes/auth');const mapsRoutes=require('./src/routes/maps');const {authRequired,adminOnly}=require('./src/auth/security');const {testConnection}=require('./src/config/db');const {notFound,errorHandler}=require('./src/middleware/errors');
const app=express();app.use(cors());app.use(express.json({limit:'1mb'}));app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.get('/api/health',(req,res)=>res.json({success:true,message:'Batloung Farm API is running.'}));
app.use('/api/auth',authRoutes);app.use('/api/maps',mapsRoutes);app.use('/api',authRequired,adminOnly,api);app.use(notFound);app.use(errorHandler);
const port=Number(process.env.PORT||3000);app.listen(port,async()=>{console.log(`Batloung Farm is running at http://localhost:${port}`);await testConnection();});
