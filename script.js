// js/script.js

// Importe as funções que você precisa dos SDKs que você precisa
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
    getFirestore,
    collection,
    addDoc,
    Timestamp,
    serverTimestamp,
    arrayUnion,
    doc,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Sua configuração do Firebase Web App
const firebaseConfig = {
  apiKey: "AIzaSyDh1n_f0xepoOF3nBJe_tJSsVdkEKkDlmM", // SUA CHAVE REAL
  authDomain: "chamados-semfas.firebaseapp.com",
  projectId: "chamados-semfas",
  storageBucket: "chamados-semfas.appspot.com",
  messagingSenderId: "1086410071473",
  appId: "1:1086410071473:web:ff8d0443de01c71ef2f190",
  measurementId: "G-EZW5TNSGEV"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Descomente se for usar o Analytics
const db = getFirestore(app); // Instância do Firestore

// Variáveis globais para instâncias de modais
let detailsModalInstance;
let alertModalInstance;

// Função para escapar caracteres HTML (simples, para prevenir XSS básico)
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, function (match) {
        return {
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[match];
    });
}

// Função para alternar a visibilidade do formulário de novo chamado
function toggleForm() {
    const form = document.getElementById('formNovoChamado');
    if (form) {
        if (form.style.display === 'none' || form.style.display === '') {
            form.style.display = 'block';
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
async function showDetailsModal(idDocumento, solicitante, equipamento, problema, status, tecnico, abertura) {
    if (!detailsModalInstance) return;

    document.getElementById('modalTicketId').textContent = idDocumento;
    document.getElementById('modalCliente').textContent = solicitante;
    document.getElementById('modalEquipamento').textContent = equipamento;
    document.getElementById('modalProblema').textContent = problema;

    const modalStatusEl = document.getElementById('modalStatus');
    if (modalStatusEl) {
        let statusClass = 'bg-secondary';
        if (status === 'Aberto') statusClass = 'bg-danger';
        else if (status === 'Em Análise') statusClass = 'bg-warning text-dark';
        else if (status === 'Finalizado') statusClass = 'bg-success';
        modalStatusEl.innerHTML = `<span class="badge ${statusClass} rounded-pill">${escapeHTML(status)}</span>`;
    }
    document.getElementById('modalTecnico').textContent = tecnico;
    document.getElementById('modalAbertura').textContent = abertura;

    const messageHistoryDiv = document.getElementById('messageHistory');
    if (messageHistoryDiv) {
        messageHistoryDiv.innerHTML = '<p class="text-muted small">Carregando mensagens...</p>';
        try {
            const chamadoDocRef = doc(db, "chamados", idDocumento);
            const docSnap = await getDoc(chamadoDocRef);

            messageHistoryDiv.innerHTML = '';
            if (docSnap.exists()) {
                const chamadoData = docSnap.data();
                if (chamadoData.mensagens && chamadoData.mensagens.length > 0) {
                    chamadoData.mensagens.forEach(msg => {
                        const p = document.createElement('p');
                        p.className = 'small mb-1 p-2 bg-white rounded border text-break';
                        let dataMensagem = msg.timestamp && msg.timestamp.toDate ?
                                           msg.timestamp.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) :
                                           '';
                        p.innerHTML = `<strong>(${escapeHTML(msg.usuario)} - ${dataMensagem}):</strong> ${escapeHTML(msg.texto)}`;
                        messageHistoryDiv.appendChild(p);
                    });
                    messageHistoryDiv.scrollTop = messageHistoryDiv.scrollHeight;
                } else {
                    messageHistoryDiv.innerHTML = '<p class="text-muted small">Nenhuma mensagem ainda.</p>';
                }
            } else {
                messageHistoryDiv.innerHTML = '<p class="text-danger small">Chamado não encontrado.</p>';
            }
        } catch (error) {
            console.error("Erro ao buscar mensagens do chamado: ", error);
            messageHistoryDiv.innerHTML = '<p class="text-danger small">Erro ao carregar mensagens.</p>';
        }
    }
    const newMessageEl = document.getElementById('newMessage');
    if (newMessageEl) {
        newMessageEl.value = '';
    }
    detailsModalInstance.show();
}
window.showDetailsModal = showDetailsModal; // Expor a função globalmente para o onclick no HTML

// Função para adicionar uma nova mensagem no histórico do modal
async function addMessage() {
    const idDocumento = document.getElementById('modalTicketId').textContent;
    const newMessageEl = document.getElementById('newMessage');
    if (!newMessageEl || !idDocumento) return;

    const newMessageText = newMessageEl.value.trim();
    if (newMessageText === '') {
        showAlertModal('Por favor, escreva uma mensagem antes de enviar.');
        return;
    }

    const novaMensagem = {
        usuario: "Técnico DTI", // Idealmente, viria de um sistema de autenticação
        texto: newMessageText,
        timestamp: serverTimestamp()
    };

    try {
        const chamadoRef = doc(db, "chamados", idDocumento);
        await updateDoc(chamadoRef, {
            mensagens: arrayUnion(novaMensagem)
        });
        newMessageEl.value = '';
        // A atualização do histórico de mensagens será feita pelo showDetailsModal ao reabrir ou
        // se você implementar um listener onSnapshot para o documento específico dentro do modal.
        // Para simplificar, vamos recarregar as mensagens se o modal for reaberto.
        // Ou, pode-se adicionar a mensagem diretamente à UI aqui para feedback imediato:
        const messageHistoryDiv = document.getElementById('messageHistory');
        if (messageHistoryDiv) {
            if (messageHistoryDiv.querySelector('.text-muted')) {
                messageHistoryDiv.innerHTML = '';
            }
            const p = document.createElement('p');
            p.className = 'small mb-1 p-2 bg-white rounded border text-break';
            let dataMensagem = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); // Aproximação do timestamp
            p.innerHTML = `<strong>(${escapeHTML(novaMensagem.usuario)} - ${dataMensagem}):</strong> ${escapeHTML(novaMensagem.texto)}`;
            messageHistoryDiv.appendChild(p);
            messageHistoryDiv.scrollTop = messageHistoryDiv.scrollHeight;
        }

    } catch (error) {
        console.error("Erro ao adicionar mensagem: ", error);
        showAlertModal('Erro ao adicionar mensagem.');
    }
}

// Função para tratar o envio do formulário de novo chamado
async function handleTicketFormSubmit(event) {
    event.preventDefault();
    const solicitante = document.getElementById('cliente').value;
    const equipamento = document.getElementById('equipamento').value;
    const problema = document.getElementById('problema').value;
    const contato = document.getElementById('contato').value;
    const patrimonio = document.getElementById('patrimonio').value;
    const dataAbertura = new Date();

    try {
        const docRef = await addDoc(collection(db, "chamados"), {
            solicitante: solicitante,
            contato: contato,
            equipamento: equipamento,
            patrimonio: patrimonio,
            problema: problema,
            status: "Aberto",
            tecnicoDTI: "-",
            dataAbertura: Timestamp.fromDate(dataAbertura),
            dataFinalizacao: null,
            mensagens: []
        });
        console.log("Chamado registrado com ID do Documento: ", docRef.id);

        document.getElementById('ticketForm').reset();
        toggleForm();
        showAlertModal('Chamado aberto e salvo com sucesso!');
        // A função carregarChamados (via onSnapshot) atualizará a lista automaticamente.
    } catch (error) {
        console.error("Erro ao salvar chamado: ", error);
        showAlertModal('Erro ao salvar chamado. Tente novamente.');
    }
}

// Função para verificar se há chamados abertos e mostrar/ocultar mensagem apropriada
function checkOpenTickets(temChamados) {
    const mensagemSemChamados = document.getElementById('noOpenTicketsMessage');
    if (mensagemSemChamados) {
        mensagemSemChamados.style.display = temChamados ? 'none' : 'block';
    }
}

// Função para verificar se há chamados finalizados e mostrar/ocultar mensagem
function checkClosedTickets(temChamados) {
    const mensagemSemChamados = document.getElementById('noClosedTicketsMessage');
     if (mensagemSemChamados) {
        mensagemSemChamados.style.display = temChamados ? 'none' : 'block';
    }
}

// Função para carregar e exibir chamados do Firestore em tempo real
function carregarChamados() {
    const q = query(collection(db, "chamados"), orderBy("dataAbertura", "desc"));

    onSnapshot(q, (querySnapshot) => {
        const listaChamadosBody = document.getElementById('listaChamados');
        const listaChamadosFinalizadosBody = document.getElementById('listaChamadosFinalizados');

        if (!listaChamadosBody || !listaChamadosFinalizadosBody) {
            console.error("Elementos da tabela não encontrados no DOM.");
            return;
        }

        listaChamadosBody.innerHTML = '';
        listaChamadosFinalizadosBody.innerHTML = '';

        let temChamadosAbertos = false;
        let temChamadosFinalizados = false;

        querySnapshot.forEach((docSnapshot) => {
            const chamado = docSnapshot.data();
            const idDocumento = docSnapshot.id;

            let dataAberturaFormatada = 'N/A';
            if (chamado.dataAbertura && chamado.dataAbertura.toDate) {
                dataAberturaFormatada = chamado.dataAbertura.toDate().toLocaleDateString('pt-BR');
            }
            let dataFinalizacaoFormatada = 'N/A';
            if (chamado.dataFinalizacao && chamado.dataFinalizacao.toDate) {
                dataFinalizacaoFormatada = chamado.dataFinalizacao.toDate().toLocaleDateString('pt-BR');
            }

            const displayId = idDocumento.substring(0, 6).toUpperCase();

            if (chamado.status !== "Finalizado") {
                temChamadosAbertos = true;
                const novaLinha = listaChamadosBody.insertRow();
                novaLinha.innerHTML = `
                    <td class="p-3 fw-bold">${displayId}</td>
                    <td class="p-3">${dataAberturaFormatada}</td>
                    <td class="p-3">${escapeHTML(chamado.solicitante)}</td>
                    <td class="p-3">${escapeHTML(chamado.equipamento)}</td>
                    <td class="p-3">${escapeHTML(chamado.problema.substring(0, 35))}${chamado.problema.length > 35 ? '...' : ''}</td>
                    <td class="p-3"><span class="badge bg-${chamado.status === 'Aberto' ? 'danger' : 'warning text-dark'} rounded-pill">${escapeHTML(chamado.status)}</span></td>
                    <td class="p-3">${escapeHTML(chamado.tecnicoDTI)}</td>
                    <td class="p-3 text-center">
                        <button class="btn btn-sm btn-info text-white" onclick="window.showDetailsModal('${idDocumento}', '${escapeHTML(chamado.solicitante.replace(/'/g, "\\'"))}', '${escapeHTML(chamado.equipamento.replace(/'/g, "\\'"))}', '${escapeHTML(chamado.problema.replace(/'/g, "\\'"))}', '${escapeHTML(chamado.status)}', '${escapeHTML(chamado.tecnicoDTI.replace(/'/g, "\\'"))}', '${dataAberturaFormatada}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/></svg>
                        </button>
                    </td>
                `;
            } else {
                temChamadosFinalizados = true;
                const novaLinhaFinalizado = listaChamadosFinalizadosBody.insertRow();
                novaLinhaFinalizado.innerHTML = `
                    <td class="p-3 fw-bold">${displayId}</td>
                    <td class="p-3">${dataFinalizacaoFormatada}</td>
                    <td class="p-3">${escapeHTML(chamado.solicitante)}</td>
                    <td class="p-3">${escapeHTML(chamado.equipamento)}</td>
                    <td class="p-3"><span class="badge bg-success rounded-pill">${escapeHTML(chamado.status)}</span></td>
                    <td class="p-3">${escapeHTML(chamado.tecnicoDTI)}</td>
                `;
            }
        });
        checkOpenTickets(temChamadosAbertos);
        checkClosedTickets(temChamadosFinalizados);
    }, (error) => {
        console.error("Erro ao carregar chamados: ", error);
        showAlertModal("Erro ao carregar chamados. Verifique o console para mais detalhes.");
    });
}


// Event Listeners e Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
    const detailsModalEl = document.getElementById('detailsModal');
    if (detailsModalEl) {
        detailsModalInstance = new bootstrap.Modal(detailsModalEl);
    }

    const alertModalEl = document.getElementById('alertModal');
    if (alertModalEl) {
        alertModalInstance = new bootstrap.Modal(alertModalEl);
    }

    const ticketForm = document.getElementById('ticketForm');
    if (ticketForm) {
        ticketForm.addEventListener('submit', handleTicketFormSubmit);
    }

    const btnAbrirNovoChamado = document.getElementById('btnAbrirNovoChamado');
    if(btnAbrirNovoChamado) {
        btnAbrirNovoChamado.addEventListener('click', toggleForm);
    }

    const btnCancelarNovoChamado = document.getElementById('btnCancelarNovoChamado');
    if(btnCancelarNovoChamado) {
        btnCancelarNovoChamado.addEventListener('click', toggleForm);
    }

    const btnEnviarMensagemModal = document.getElementById('btnEnviarMensagemModal');
    if(btnEnviarMensagemModal) {
        btnEnviarMensagemModal.addEventListener('click', addMessage);
    }
    
    carregarChamados(); // Carrega os chamados do Firebase
    checkOpenTickets(false); // Inicializa as mensagens
    checkClosedTickets(false);
});

