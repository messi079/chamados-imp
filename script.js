// js/script.js

let nextTicketId = 103; // ID inicial para novos chamados, seguindo os exemplos
const ticketMessages = {}; // Objeto para armazenar mensagens por ID de chamado
let detailsModalInstance; // Instância do modal de detalhes do Bootstrap
let alertModalInstance; // Instância do modal de alerta do Bootstrap

// Garante que o DOM está completamente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', function () {
    // Inicializa as instâncias dos modais do Bootstrap
    const detailsModalEl = document.getElementById('detailsModal');
    if (detailsModalEl) {
        detailsModalInstance = new bootstrap.Modal(detailsModalEl);
    }

    const alertModalEl = document.getElementById('alertModal');
    if (alertModalEl) {
        alertModalInstance = new bootstrap.Modal(alertModalEl);
    }

    // Adiciona o listener ao formulário de novo chamado
    const ticketForm = document.getElementById('ticketForm');
    if (ticketForm) {
        ticketForm.addEventListener('submit', handleTicketFormSubmit);
    }

    checkOpenTickets(); // Verifica se há chamados abertos ao carregar a página
});

// Função para alternar a visibilidade do formulário de novo chamado
function toggleForm() {
    const form = document.getElementById('formNovoChamado');
    if (form) {
        if (form.style.display === 'none' || form.style.display === '') {
            form.style.display = 'block';
            form.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Rola para o formulário
        } else {
            form.style.display = 'none';
        }
    }
}

// Função para exibir o modal de alerta com uma mensagem específica
function showAlertModal(message) {
    const alertModalMessageEl = document.getElementById('alertModalMessage');
    if (alertModalMessageEl && alertModalInstance) {
        alertModalMessageEl.textContent = message;
        alertModalInstance.show();
    }
}

// Função para exibir o modal com detalhes de um chamado específico
function showDetailsModal(id, cliente, impressora, problema, status, tecnico, abertura) {
    if (!detailsModalInstance) return;

    document.getElementById('modalTicketId').textContent = id;
    document.getElementById('modalCliente').textContent = cliente;
    document.getElementById('modalImpressora').textContent = impressora;
    document.getElementById('modalProblema').textContent = problema; // Problema já vem formatado ou é texto puro

    // Define o status com a cor correspondente da badge
    const modalStatusEl = document.getElementById('modalStatus');
    if (modalStatusEl) {
        let statusClass = 'bg-secondary'; // Cor padrão
        if (status === 'Aberto') statusClass = 'bg-danger';
        else if (status === 'Em Análise') statusClass = 'bg-warning text-dark';
        else if (status === 'Finalizado') statusClass = 'bg-success';
        modalStatusEl.innerHTML = `<span class="badge ${statusClass} rounded-pill">${status}</span>`;
    }

    document.getElementById('modalTecnico').textContent = tecnico;
    document.getElementById('modalAbertura').textContent = abertura;

    const messageHistoryDiv = document.getElementById('messageHistory');
    if (messageHistoryDiv) {
        messageHistoryDiv.innerHTML = ''; // Limpa o histórico anterior
        // Carrega e exibe mensagens do chamado, se houver
        if (ticketMessages[id] && ticketMessages[id].length > 0) {
            ticketMessages[id].forEach(msg => {
                const p = document.createElement('p');
                p.className = 'small mb-1 p-2 bg-white rounded border text-break'; // text-break para quebrar palavras longas
                p.innerHTML = `<strong>(${escapeHTML(msg.user)} - ${escapeHTML(msg.time)}):</strong> ${escapeHTML(msg.text)}`; // Escapa HTML para segurança
                messageHistoryDiv.appendChild(p);
            });
        } else {
            messageHistoryDiv.innerHTML = '<p class="text-muted small">Nenhuma mensagem ainda.</p>';
        }
    }
    const newMessageEl = document.getElementById('newMessage');
    if (newMessageEl) {
        newMessageEl.value = ''; // Limpa o campo de nova mensagem
    }
    detailsModalInstance.show(); // Exibe o modal
}

// Função para adicionar uma nova mensagem no histórico do modal
function addMessage() {
    const ticketId = document.getElementById('modalTicketId').textContent;
    const newMessageEl = document.getElementById('newMessage');
    if (!newMessageEl) return;

    const newMessageText = newMessageEl.value.trim();

    if (newMessageText === '') {
        showAlertModal('Por favor, escreva uma mensagem antes de enviar.');
        return;
    }

    if (!ticketMessages[ticketId]) { // Cria array de mensagens se não existir
        ticketMessages[ticketId] = [];
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); // Formata a hora

    ticketMessages[ticketId].push({ user: 'Você', text: newMessageText, time: timeString });

    // Atualiza a exibição do histórico de mensagens no modal
    const messageHistoryDiv = document.getElementById('messageHistory');
    if (messageHistoryDiv) {
        if (messageHistoryDiv.querySelector('.text-muted')) { // Remove a mensagem "Nenhuma mensagem ainda"
            messageHistoryDiv.innerHTML = '';
        }
        const p = document.createElement('p');
        p.className = 'small mb-1 p-2 bg-white rounded border text-break';
        p.innerHTML = `<strong>(Você - ${escapeHTML(timeString)}):</strong> ${escapeHTML(newMessageText)}`;
        messageHistoryDiv.appendChild(p);
        messageHistoryDiv.scrollTop = messageHistoryDiv.scrollHeight; // Rola para a última mensagem
    }
    newMessageEl.value = ''; // Limpa o campo de texto
}

// Função para tratar o envio do formulário de novo chamado
function handleTicketFormSubmit(event) {
    event.preventDefault(); // Impede o comportamento padrão de envio do formulário

    // Coleta os valores dos campos do formulário
    const cliente = document.getElementById('cliente').value;
    const impressora = document.getElementById('impressora').value;
    const problema = document.getElementById('problema').value;
    // const contato = document.getElementById('contato').value; // Descomente se for usar
    // const serie = document.getElementById('serie').value; // Descomente se for usar

    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR'); // Formata a data

    const tabela = document.getElementById('listaChamados');
    if (!tabela) return;

    const novaLinha = tabela.insertRow(0); // Insere a nova linha no topo da tabela
    novaLinha.innerHTML = `
        <td class="p-3">${nextTicketId}</td>
        <td class="p-3">${dataFormatada}</td>
        <td class="p-3">${escapeHTML(cliente)}</td>
        <td class="p-3">${escapeHTML(impressora)}</td>
        <td class="p-3">${escapeHTML(problema.substring(0, 30))}${problema.length > 30 ? '...' : ''}</td>
        <td class="p-3"><span class="badge bg-danger rounded-pill">Aberto</span></td>
        <td class="p-3">-</td>
        <td class="p-3 text-center">
            <button class="btn btn-sm btn-info text-white" onclick="showDetailsModal(${nextTicketId}, '${escapeHTML(cliente.replace(/'/g, "\\'"))}', '${escapeHTML(impressora.replace(/'/g, "\\'"))}', '${escapeHTML(problema.replace(/'/g, "\\'"))}', 'Aberto', '-', '${dataFormatada}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/></svg>
            </button>
        </td>
    `;
    nextTicketId++; // Incrementa o ID para o próximo chamado

    const ticketForm = document.getElementById('ticketForm');
    if (ticketForm) {
        ticketForm.reset(); // Limpa o formulário
    }
    toggleForm(); // Esconde o formulário
    showAlertModal('Chamado aberto com sucesso (visualmente)!');
    checkOpenTickets(); // Atualiza a mensagem se não houver chamados
}

// Função para escapar caracteres HTML e prevenir XSS básico
function escapeHTML(str) {
    if (typeof str !== 'string') return ''; // Retorna string vazia se não for string
    return str.replace(/[&<>"']/g, function (match) {
        // Mapeia caracteres especiais para suas entidades HTML correspondentes
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;' // ou &apos;
        }[match];
    });
}

// Função para verificar se há chamados abertos e mostrar/ocultar mensagem apropriada
function checkOpenTickets() {
    const tabelaChamados = document.getElementById('listaChamados');
    const mensagemSemChamados = document.getElementById('noOpenTicketsMessage');

    if (tabelaChamados && mensagemSemChamados) {
        if (tabelaChamados.rows.length === 0) {
            mensagemSemChamados.style.display = 'block'; // Mostra a mensagem
        } else {
            mensagemSemChamados.style.display = 'none'; // Oculta a mensagem
        }
    }
}
