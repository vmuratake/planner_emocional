
const express = require("express");
const controller = require("../controllers/checkin.controller");

const router = express.Router();

router.get("/", controller.listar);
router.get("/by-date/:data", controller.buscarByDate);
router.post("/", controller.criar);
router.get("/historico", controller.buscarHistorico);
router.delete("/:id", controller.excluir);



module.exports = router;