function formatarDataExtensaPTBR(data = new Date()) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(data)
}

function renderizarDataTopo() {
    const el = document.getElementById("dataAtual");
    el.textContent = formatarDataExtensaPTBR(new Date());
}


function prepararFormularioMock() {
    const form = document.getElementById("checkinForm");
    const status = document.getElementById("status");

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const selecionado = document.querySelector('input[name="nivel_energia"]:checked');
        if (!selecionado) {
            status.textContent = "Selecione um nível de energia para continuar.";
            return
        }

        status.textContent = "Layout OK - Formulário pronto para integração futura.";
        console.log("Nível de energia selecionado:", selecionado.value);
    });


        const btnLimpar = document.getElementById("btnLimpar");
    
    btnLimpar.addEventListener("click", () => {
        //desmarca a opção nivel de energia selecionada
        const selecionado = document.querySelector('input[name="nivel_energia"]:checked');
        if (selecionado) {
            selecionado.checked = false;
        }   

        //limpa o status e retorna a mensagem
        status.textContent = "Formulário limpo. Selecione um nível de energia para continuar.";

});
}




renderizarDataTopo();
prepararFormularioMock();
