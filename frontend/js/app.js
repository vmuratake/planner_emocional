const dataTopo = document.getElementById("dataTopo");
const form = document.getElementById("checkinForm");
const statusMsg = document.getElementById("status");
const btnLimpar = document.getElementById("btnLimpar");


function formatarDataHojePTBR() {
    const hoje = new Date();
    return hoje.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

dataTopo.textContent = formatarDataHojePTBR();

form.addEventListener("submit", (event) => {
    event.preventDefault();         

    const selecionado = document.querySelector('input[name="nivel_energia"]:checked');
    if (!selecionado) {
        statusMsg.textContent = "Selecione um nível de energia para continuar.";
        return
    }   

    statusMsg.textContent = "Layout OK - Formulário pronto para integração futura.";
});


    
    btnLimpar.addEventListener("click", () => {
        form.reset();
        statusMsg.textContent = "Formulário limpo. Selecione um nível de energia para continuar.";


        //desmarca a opção nivel de energia selecionada
        const selecionado = document.querySelector('input[name="nivel_energia"]:checked');
        if (selecionado) {
            selecionado.checked = false;
        }   


});





renderizarDataTopo();
prepararFormularioMock();
