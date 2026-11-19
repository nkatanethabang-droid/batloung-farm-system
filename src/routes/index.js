const express=require('express');
const {controller}=require('../controllers/masterController');
const stock=require('../controllers/stockController');
const tx=require('../controllers/transactionController');
const reports=require('../controllers/reportController');
const router=express.Router();
for(const name of ['suppliers','fruits','vendors']){const c=controller(name);router.get(`/${name}`,c.list);router.post(`/${name}`,c.create);router.get(`/${name}/:id`,c.get);router.put(`/${name}/:id`,c.update);router.delete(`/${name}/:id`,c.remove);}
router.get('/stock',stock.list);router.get('/stock/low',stock.low);router.get('/prices',stock.prices);router.put('/prices',stock.updatePrice);
router.post('/purchases',tx.purchase);router.post('/sales',tx.sale);router.post('/sales/:saleId/payments',tx.addPayment);
router.get('/dashboard',reports.summary);router.get('/reports',reports.reports);
module.exports=router;
