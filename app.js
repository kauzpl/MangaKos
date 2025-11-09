// VARIÁVEL GLOBAL PARA A TABELA
let mangaTable = null; 
const STORAGE_KEY = 'meusMangas';

// --- I. FUNÇÕES DE STATUS E VALIDAÇÃO ---

/**
 * Define o status do manga com base no progresso (Status Inteligente).
 */
function getSmartStatus(capituloAtual, totalCapitulos) {
    // Certifica-se de que os valores são números
    const capAtual = parseInt(capituloAtual) || 0;
    const capTotal = parseInt(totalCapitulos) || 0;

    if (capTotal > 0 && capAtual >= capTotal) {
        return 'Concluído';
    }
    if (capAtual > 0) {
        return 'Lendo';
    }
    return 'Planejo Ler';
}

// --- II. FUNÇÕES BÁSICAS DE ARMAZENAMENTO (localStorage) ---

function getMangasFromStorage() {
    const mangasJSON = localStorage.getItem(STORAGE_KEY);
    return mangasJSON ? JSON.parse(mangasJSON).map(m => ({
        ...m,
        id: m.id || Date.now().toString() + Math.random().toString(36).substring(2),
        // Garante que Capítulos e Notas sejam números, resolvendo o erro 'undefined / undefined'
        capituloAtual: parseInt(m.capituloAtual) || 0,
        totalCapitulos: parseInt(m.totalCapitulos) || 1, 
        nota: parseFloat(m.nota) || 0, // Corrigindo data.toFixed error
        // Garante que campos opcionais existam
        generos: m.generos || [], 
        descricao: m.descricao || ''
    })) : [];
}

function saveMangasToStorage(mangas) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mangas));
}

/**
 * Salva um novo manga ou atualiza um existente, calculando o status.
 */
function saveManga(mangaData) {
    let mangas = getMangasFromStorage();
    
    // Calcula o status inteligente
    mangaData.status = getSmartStatus(mangaData.capituloAtual, mangaData.totalCapitulos);
    
    // Verifica se é uma EDIÇÃO
    if (mangaData.id) {
        const index = mangas.findIndex(m => m.id === mangaData.id);
        if (index > -1) {
            mangas[index] = { ...mangas[index], ...mangaData, dataAtualizacao: new Date().toISOString() };
        }
    } 
    // Se for ADIÇÃO
    else {
        mangaData.id = Date.now().toString() + Math.random().toString(36).substring(2);
        mangaData.dataAtualizacao = new Date().toISOString();
        mangas.push(mangaData);
    }
    
    saveMangasToStorage(mangas);
    renderizarTabela();
}

function deleteManga(mangaId) {
    let mangas = getMangasFromStorage();
    const mangasAtualizados = mangas.filter(m => m.id !== mangaId);
    saveMangasToStorage(mangasAtualizados);
    renderizarTabela();
}

// --- III. LÓGICA DE RENDERIZAÇÃO E DATATABLES ---

/**
 * Cria a badge (etiqueta) de status com base no valor.
 */
function createStatusBadge(status) {
    let className = 'badge-planejo';
    if (status === 'Lendo') {
        className = 'badge-lendo';
    } else if (status === 'Concluído') {
        className = 'badge-concluido';
    }
    return `<span class="manga-badge ${className}">${status}</span>`;
}

/**
 * Cria o display de progresso (Cap. / Total)
 */
function createProgressDisplay(capAtual, capTotal) {
    const progress = (capAtual / (capTotal || 1)) * 100;
    const progressClass = progress >= 100 ? 'progress-done' : 'progress-reading';
    
    return `
        <div class="progress-controls">
            <button class="btn-action btn-progress" data-action="decrease">-</button>
            <div class="progress-container">
                <span>${capAtual} / ${capTotal}</span>
                <div class="progress-bar-bg">
                    <div class="progress-bar ${progressClass}" style="width: ${progress}%"></div>
                </div>
            </div>
            <button class="btn-action btn-progress" data-action="increase">+</button>
        </div>
        <div class="progress-container" style="display:none;">
            <span>${capAtual} / ${capTotal}</span>
            <div class="progress-bar-bg">
                <div class="progress-bar ${progressClass}" style="width: ${progress}%"></div>
            </div>
        </div>
    `;
}

function renderizarTabela() {
    let data = getMangasFromStorage();

    // Aplica filtros antes de renderizar
    const statusFilter = $('#filter-status').val();
    const genreFilter = $('#filter-genre').val();

    if (statusFilter && statusFilter !== 'Todos') {
        data = data.filter(m => m.status === statusFilter);
    }
    if (genreFilter && genreFilter !== 'Todos') {
        data = data.filter(m => m.generos && m.generos.includes(genreFilter));
    }

    if (mangaTable) {
        mangaTable.destroy();
    }
    
    mangaTable = $('#mangaTable').DataTable({
        data: data,
        // ** 5 COLUNAS **
        columns: [
            { 
                data: 'titulo', 
                title: 'Título',
                render: function(data, type, row) {
                    // Exibe o título e os gêneros
                    const generosHtml = Array.isArray(row.generos) 
                        ? row.generos.map(g => `<span class="genre-tag">${g}</span>`).join(' ')
                        : '';
                    return `<div>${data}</div><div class="genre-list">${generosHtml}</div>`;
                }
            },
            { 
                data: 'status', 
                title: 'Status',
                render: function(data) {
                    return createStatusBadge(data);
                }
            },
            { 
                data: null, 
                title: 'Progresso',
                render: function(data, type, row) {
                    return createProgressDisplay(row.capituloAtual, row.totalCapitulos);
                }
            },
            { 
                data: 'nota', 
                title: 'Nota',
                className: 'dt-body-center col-nota', /* Adiciona a classe para responsividade */
                render: function(data) {
                    // *** CORREÇÃO: Trata dado como número ou zero ***
                    const notaNumerica = parseFloat(data) || 0; 
                    return `<span class="rating-star">⭐ ${notaNumerica.toFixed(1)}</span>`;
                }
            },
            {
                data: null, 
                title: 'Ações',
                orderable: false,
                className: 'dt-body-right', 
                render: function(data, type, row) {
                    return `
                        <button class="btn-action edit-btn" data-id="${row.id}">Editar</button>
                        <button class="btn-action delete-btn" data-id="${row.id}">Deletar</button>
                    `;
                }
            }
        ],
        // Configurações Adicionais
        paging: true,
        pageLength: 10,
        searching: true,
        info: true,
        responsive: true, // Ativa a extensão Responsive
        order: [[0, 'asc']] // Ordena por Título por padrão
    });
}

// --- IV. LÓGICA DO MODAL/FORMULÁRIO ---

function openMangaModal(manga = null) {
    const form = $('#mangaForm');
    
    form[0].reset();
    $('#mangaId').val('');
    // Limpa o seletor de gêneros customizado
    $('#generos-dropdown input[type="checkbox"]').prop('checked', false);
    updateGenreDisplay();
    
    // Se for EDIÇÃO
    if (manga) {
        $('#mangaModal h2').text('Editar Manga');
        $('#saveMangaBtn').text('Salvar Alterações');

        $('#mangaId').val(manga.id);
        $('#titulo').val(manga.titulo);
        $('#capituloAtual').val(manga.capituloAtual);
        $('#totalCapitulos').val(manga.totalCapitulos);
        $('#nota').val(manga.nota);
        $('#descricao').val(manga.descricao);

        // Preenche o seletor de gêneros customizado
        if (manga.generos && manga.generos.length > 0) {
            manga.generos.forEach(genre => {
                $(`#generos-dropdown input[value="${genre}"]`).prop('checked', true);
            });
            updateGenreDisplay();
        }
    } else {
        $('#mangaModal h2').text('Adicionar Novo Manga');
        $('#saveMangaBtn').text('Salvar');
    }

    // Adiciona a classe 'show' para ativar a animação de fade-in
    $('#mangaModal').addClass('show');
}

/**
 * Lógica para o seletor de gêneros customizado
 */
function setupGenreSelector() {
    // Lógica para popular e controlar o seletor de gêneros
    const allGenres = ["Ação", "Aventura", "Comédia", "Drama", "Fantasia", "Ficção Científica", "Isekai", "Mistério", "Romance", "Terror"];
    const $dropdown = $('#generos-dropdown');
    const $display = $('#generos-display');

    // 1. Popula o dropdown com checkboxes
    allGenres.forEach(genre => {
        const optionHtml = `
            <label class="genre-option">
                <input type="checkbox" value="${genre}">
                ${genre}
            </label>
        `;
        $dropdown.append(optionHtml);
    });

    // 2. Abre/fecha o dropdown
    $display.on('click', function() {
        $(this).parent().toggleClass('open');
    });

    // 3. Fecha ao clicar fora
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.custom-multiselect-wrapper').length) {
            $('.custom-multiselect-wrapper').removeClass('open');
        }
    });

    // 4. Atualiza o display quando um checkbox é alterado
    $dropdown.on('change', 'input[type="checkbox"]', updateGenreDisplay);
}

function updateGenreDisplay() {
    const $display = $('#generos-display');
    const selectedGenres = [];
    $('#generos-dropdown input:checked').each(function() {
        selectedGenres.push($(this).val());
    });

    $display.empty();
    if (selectedGenres.length > 0) {
        selectedGenres.forEach(genre => {
            $display.append(`<span class="genre-pill">${genre}</span>`);
        });
    } else {
        $display.append('<span class="placeholder">Selecione os gêneros...</span>');
    }
}

function closeMangaModal() {
    // Remove a classe 'show' para ativar a animação de fade-out
    $('#mangaModal').removeClass('show');
}


// --- V. LÓGICA DE IMPORT/EXPORT JSON (Backup) ---

function exportMangas() {
    const mangas = getMangasFromStorage();
    const dataStr = JSON.stringify(mangas, null, 2); 
    
    // Sugestão 1: Usar jQuery para consistência
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const $a = $('<a>', {
        href: url,
        download: `backup_mangas_${new Date().toISOString().slice(0, 10)}.json`
    }).appendTo('body');

    $a[0].click();
    $a.remove();
    URL.revokeObjectURL(url);
    alert("Backup JSON exportado com sucesso!");
}

function setupImportListener() {
    $('#input-import-json').on('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedData)) {
                    throw new Error("O arquivo JSON não é uma lista válida (deve ser um array).");
                }

                if (confirm("ATENÇÃO: Este processo irá SUBSTITUIR todos os seus mangás salvos localmente. Deseja continuar?")) {
                    saveMangasToStorage(importedData);
                    renderizarTabela();
                    alert("Dados importados com sucesso!");
                }
            } catch (error) {
                alert("Erro ao ler ou processar o arquivo JSON: " + error.message);
            }
        };

        reader.readAsText(file);
        $('#input-import-json').val('');
    });
}

// --- VII. LÓGICA DOS FILTROS ---

function populateFilters() {
    const mangas = getMangasFromStorage();
    const statusSet = new Set();
    // Mantém os valores atuais para não resetar a seleção do usuário
    const genreSet = new Set();

    mangas.forEach(manga => {
        statusSet.add(manga.status);
        if (manga.generos) {
            manga.generos.forEach(g => genreSet.add(g));
        }
    });

    const $statusFilter = $('#filter-status');
    const currentStatus = $statusFilter.val();
    $statusFilter.html('<option value="Todos">Todos</option>');
    Array.from(statusSet).sort().forEach(status => {
        $statusFilter.append($('<option>', { value: status, text: status }));
    });

    const $genreFilter = $('#filter-genre');
    const currentGenre = $genreFilter.val();
    $genreFilter.html('<option value="Todos">Todos</option>');
    Array.from(genreSet).sort().forEach(genre => {
        $genreFilter.append($('<option>', { value: genre, text: genre }));
    });
}


// --- VI. INICIALIZAÇÃO E EVENT LISTENERS ---

$(document).ready(function() {
    
    // Inicializa o seletor de gêneros customizado
    setupGenreSelector();

    // Popula os filtros e renderiza a tabela inicial
    populateFilters();
    renderizarTabela();

    // 1. ABRIR MODAL (Adicionar)
    $('#btn-adicionar').on('click', function() {
        openMangaModal();
    });

    // Sugestão 1: Mover o evento 'onclick' para o JS
    $('#btn-cancelar-modal').on('click', function() {
        closeMangaModal();
    });

    // 2. FECHAR MODAL
    $('.close-btn').on('click', closeMangaModal);
    $(window).on('click', function(event) {
        if ($(event.target).is('#mangaModal')) {
            closeMangaModal();
        }
    });

    // 3. SUBMISSÃO DO FORMULÁRIO
    $('#mangaForm').on('submit', function(e) {
        e.preventDefault();
        
        // Lendo os valores do novo seletor de gêneros
        const generosArray = [];
        $('#generos-dropdown input:checked').each(function() {
            generosArray.push($(this).val());
        });

        const capituloAtual = parseInt($('#capituloAtual').val());
        const totalCapitulos = parseInt($('#totalCapitulos').val());
        const nota = parseFloat($('#nota').val());

        // Validação de lógica
        if (capituloAtual > totalCapitulos) {
             alert("Erro: O Capítulo Atual não pode ser maior que o Total de Capítulos.");
             return;
        }

        const mangaData = {
            id: $('#mangaId').val() || null,
            titulo: $('#titulo').val(),
            capituloAtual: capituloAtual,
            totalCapitulos: totalCapitulos,
            nota: nota,
            descricao: $('#descricao').val(),
            generos: generosArray 
        };
        
        saveManga(mangaData);
        populateFilters(); // Atualiza os filtros caso um novo gênero/status seja criado
        closeMangaModal();
    });

    // 4. AÇÕES DA TABELA (Editar e Deletar)
    $('#mangaTable').on('click', '.edit-btn', function() {
        const mangaId = $(this).data('id');
        const mangas = getMangasFromStorage();
        const mangaToEdit = mangas.find(m => m.id === mangaId);
        
        if (mangaToEdit) {
            openMangaModal(mangaToEdit);
        }
    });

    $('#mangaTable').on('click', '.delete-btn', function() {
        const mangaId = $(this).data('id');
        const manga = getMangasFromStorage().find(m => m.id === mangaId);
        
        if (manga && confirm(`Tem certeza que deseja deletar "${manga.titulo}"?`)) {
            deleteManga(mangaId);
            populateFilters(); // Atualiza os filtros
        }
    });

    // Ação para botões de progresso na tabela
    $('#mangaTable').on('click', '.btn-progress', function() {
        const mangaId = $(this).closest('tr').find('.edit-btn').data('id');
        const action = $(this).data('action');
        
        let mangas = getMangasFromStorage();
        const mangaIndex = mangas.findIndex(m => m.id === mangaId);

        if (mangaIndex > -1) {
            let manga = mangas[mangaIndex];
            if (action === 'increase' && manga.capituloAtual < manga.totalCapitulos) {
                manga.capituloAtual++;
            } else if (action === 'decrease' && manga.capituloAtual > 0) {
                manga.capituloAtual--;
            }

            // Atualiza o status e salva
            manga.status = getSmartStatus(manga.capituloAtual, manga.totalCapitulos);
            saveMangasToStorage(mangas);
            renderizarTabela(); // Re-renderiza para refletir a mudança
        }
    });
    
    // 5. BOTÕES DE BACKUP JSON
    $('#btn-export-json').on('click', exportMangas);
    $('#btn-import-json').on('click', function() {
        $('#input-import-json').click();
    });
    
    setupImportListener(); 

    // 6. EVENT LISTENERS DOS FILTROS
    $('#filter-status, #filter-genre').on('change', function() {
        renderizarTabela();
    });
});