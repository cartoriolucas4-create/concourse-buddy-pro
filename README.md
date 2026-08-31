# Concurso Central

Perfeito. Eu faria a consolidação do prompt, mantendo a proposta original e incorporando exatamente os pontos que você escolheu: lembretes, concursos, controle do conteúdo do edital, modo “Hoje” e o modo de configuração poderoso.
Também ajustaria o prompt anterior para deixar explícito que questões, banco de questões e desempenho por questões NÃO fazem parte do produto principal.
Crie uma aplicação web completa chamada Central de Estudos para Concurseiro, utilizando como referência visual e estrutural a planilha apresentada no vídeo enviado.
IMPORTANTE: a aplicação NÃO deve ser uma plataforma de questões, cursinho ou plataforma de conteúdo.
O usuário já possui seu cursinho, PDFs, videoaulas, banco de questões e demais materiais em outras plataformas.
O objetivo deste sistema é ser uma central de organização, planejamento e controle dos estudos.
A aplicação deve responder principalmente:
O que eu planejei estudar?
O que eu realmente estudei?
Quanto tempo estudei?
O que está pendente?
O que preciso revisar?
Como está meu progresso no edital?
O que tenho planejado para hoje?
Quais são minhas próximas obrigações relacionadas ao concurso?
Como está minha organização semanal?
Não criar um sistema complexo de questões.
1. CONCEITO PRINCIPAL
A aplicação deve funcionar como um painel pessoal de organização de estudos para concursos públicos.
Ela deve separar claramente:
PLANEJAMENTO
O que eu pretendia estudar.
REALIZADO
O que eu efetivamente estudei.
PENDÊNCIAS
O que ficou para trás e pode ser reorganizado.
REVISÕES
O que eu preciso revisar.
EDITAL
O quanto do conteúdo que pretendo estudar já foi concluído.
O sistema nunca deve punir o usuário por não estudar em determinado dia.
Se uma matéria estava planejada para segunda-feira e não foi estudada, isso NÃO significa que toda a programação seguinte precisa ser deslocada.
Registrar o ocorrido e permitir reorganização manual.
2. MODO DE CONFIGURAÇÃO PODEROSO
Criar uma área inicial chamada:
CONFIGURAR MINHA CENTRAL
Essa será uma das partes mais importantes da aplicação.
Antes de utilizar o sistema, o usuário poderá configurar como deseja organizar seus estudos.
Estrutura dos dias
Permitir escolher:
Segunda a domingo
Domingo a sábado
Segunda a sexta
Dia 1 a Dia 7
Estrutura personalizada
Exemplo:
Se escolher "Dia 1 a Dia 7":
Dia 1
Dia 2
Dia 3
Dia 4
Dia 5
Dia 6
Dia 7
Esses dias podem funcionar como um ciclo independente do calendário.
3. QUANTIDADE DE MATÉRIAS POR DIA
Permitir configurar:
1 matéria por dia
2 matérias por dia
3 matérias por dia
4 matérias por dia
5 matérias por dia
quantidade personalizada
Exemplo:
3 matérias por dia.
Mostrar:
1ª matéria
2ª matéria
3ª matéria
Mas esses campos NÃO são obrigatórios.
Posso ter:
Segunda:
Direito Penal
Constitucional
[vazio]
4. CADASTRO DAS MATÉRIAS
Criar uma área:
MINHAS MATÉRIAS
Permitir cadastrar:
Nome
Área
Cor
Prioridade
Ativa/inativa
Observação
Exemplo:
Direito Penal
Direito Constitucional
Direito Administrativo
Processo Penal
Português
Informática
As matérias cadastradas devem ficar disponíveis para serem utilizadas no planejamento.
5. FREQUÊNCIA DAS MATÉRIAS
Permitir informar uma frequência desejada.
Exemplo:
Direito Penal → 3 vezes por semana
Constitucional → 2 vezes por semana
Português → 2 vezes por semana
Informática → 1 vez por semana
Isso deve funcionar como uma sugestão de organização.
NÃO deve impedir alterações manuais.
6. DRAG AND DROP
A distribuição das matérias deve utilizar drag and drop fluido.
Quero poder pegar:
"Informática"
que está na:
Quinta-feira — 1ª matéria
e arrastar para:
Sexta-feira — 2ª matéria.
Permitir:
Arrastar entre dias
Trocar posições
Arrastar para espaços vazios
Reordenar matérias
Remover matéria
Duplicar matéria
Mover matéria de posição
A interface deve ter comportamento semelhante ao Trello/Notion.
Durante o arraste:
Destacar destino
Mostrar animação
Mostrar prévia
Transição suave
Evitar deslocamentos inesperados
O recurso deve funcionar também em dispositivos móveis, adaptando a interação para touch.
7. SEMANA MODELO
Permitir salvar uma estrutura como:
SEMANA MODELO
Exemplo:
Segunda:
Penal
Constitucional
Português
Terça:
Administrativo
Informática
Penal
Quarta:
Constitucional
Português
Processo Penal
O usuário poderá:
Salvar modelo
Editar modelo
Duplicar modelo
Aplicar modelo a uma nova semana
8. CICLO DE ESTUDOS
Além do planejamento semanal, criar:
MODO CICLO
O usuário poderá criar uma sequência:
Direito Penal
Constitucional
Português
Administrativo
Processo Penal
Informática
O ciclo não depende do dia da semana.
Se o usuário não estudar em determinado dia, o ciclo não deve ser destruído.
Permitir:
Definir ordem
Definir duração de cada sessão
Pausar ciclo
Retomar ciclo
Alterar ordem
Inserir/remover matéria
Permitir alternar entre:
Planejamento semanal
e
Ciclo de estudos
9. CONTROLE DO CONTEÚDO DO EDITAL
Criar uma área:
MEU EDITAL
O objetivo NÃO é armazenar PDFs ou aulas.
O objetivo é controlar o que precisa ser estudado.
Estrutura:
Concurso
→ Matéria
→ Assunto
→ Subassunto
Exemplo:
Direito Penal
→ Teoria do Crime
→ Tipicidade
→ Ilicitude
→ Culpabilidade
→ Concurso de pessoas
Cada item poderá ter:
Não iniciado
Em andamento
Concluído
Revisão pendente
Permitir alterar o status facilmente.
10. PROGRESSO DO EDITAL
Mostrar:
Progresso geral
42% concluído
E detalhar por matéria:
Direito Penal — 75%
Constitucional — 60%
Administrativo — 35%
Português — 80%
Permitir visualizar:
Progresso geral
Progresso por matéria
Progresso por assunto
Conteúdos concluídos
Conteúdos pendentes
Criar barras de progresso visualmente claras.
11. CONCURSOS
Criar uma área:
MEUS CONCURSOS
Permitir cadastrar múltiplos concursos.
Campos:
Nome do concurso
Órgão
Cargo
Banca
Data da prova
Data de inscrição
Prazo de inscrição
Local da prova
Status
Prioridade
Link do edital
Observações
Status:
Pesquisando
Estudando
Inscrição aberta
Inscrito
Prova realizada
Finalizado
12. CONTADOR PARA A PROVA
Se houver data da prova:
Mostrar:
Faltam 87 dias para a prova
Atualizar automaticamente.
Também mostrar:
Data da prova
Dias restantes
Status da inscrição
Se o prazo de inscrição estiver próximo:
⚠️ Inscrições encerram em 4 dias.
13. ASSOCIAR EDITAL AO CONCURSO
Permitir associar matérias e conteúdos a cada concurso.
Exemplo:
Polícia Federal — Agente
Direito Penal
Constitucional
Administrativo
Português
Informática
O usuário poderá definir quais matérias pertencem a cada concurso.
Uma matéria pode pertencer a vários concursos.
14. LEMBRETES
Criar uma área:
LEMBRETES
Permitir cadastrar:
Título
Descrição
Data
Horário opcional
Prioridade
Categoria
Status
Exemplos:
Conferir edital
Fazer inscrição
Separar material
Revisar determinado assunto
Atualizar planejamento
Fazer simulado
Conferir resultado
Preparar documentação
Categorias:
Estudo
Concurso
Edital
Revisão
Administrativo
Pessoal
Permitir marcar como concluído.
15. CENTRAL DE HOJE
Criar uma tela chamada:
HOJE
Essa deve ser a tela mais simples e prática da aplicação.
Mostrar:
Planejado para hoje
Direito Penal
Tempo planejado: 1h30
[Iniciar estudo]
Constitucional
Tempo planejado: 1h
[Iniciar estudo]
Português
Tempo planejado: 1h
[Iniciar estudo]
16. REGISTRO RÁPIDO DE ESTUDO
Ao clicar em:
Iniciar estudo
abrir uma sessão simples.
Permitir:
Iniciar cronômetro
Pausar
Finalizar
Ao finalizar:
Tempo estudado:
01h27
Assunto:
Culpabilidade
Observação opcional.
[Salvar estudo]
Não exigir preenchimento excessivo.
17. RESUMO DO DIA
Na tela Hoje mostrar:
Resumo
Horas estudadas:
2h15
Meta:
4h
Progresso:
56%
Matérias concluídas:
2/3
Pendências:
1
Revisões:
2
Lembretes:
1
18. PENDÊNCIAS
Criar uma área:
PENDÊNCIAS
Mostrar aquilo que ficou para trás.
Exemplo:
Direito Penal
Planejado para segunda
Não realizado
Constitucional
Estudo parcial
Revisão de Português
Vencida
Permitir:
Reagendar
Marcar como concluído
Ignorar
Adicionar ao próximo ciclo
Arrastar para outro dia
IMPORTANTE:
Não chamar automaticamente tudo de "atraso".
Uma pendência é apenas algo que ficou aberto.
19. REVISÕES
Criar uma área simples:
REVISÕES
Ao concluir um assunto, permitir marcar uma próxima revisão.
Exemplo:
Direito Penal
Culpabilidade
Próxima revisão:
30/08/2026
Mostrar na Central:
🔄 3 revisões para hoje.
Permitir configurar intervalos padrão:
1 dia
7 dias
15 dias
30 dias
Mas permitir alterar manualmente a data.
Não criar um sistema complexo de repetição espaçada.
20. DASHBOARD
Criar dashboard com:
Hoje
Horas estudadas
Progresso da meta
Matérias planejadas
Matérias concluídas
Semana
Horas planejadas
Horas realizadas
Progresso
Dias estudados
Edital
Percentual concluído
Pendências
Quantidade
Revisões
Quantidade
Concursos
Próximas provas
Lembretes
Próximos compromissos
21. PLANEJADO × REALIZADO
Essa distinção deve aparecer claramente.
Exemplo:
Direito Penal
Planejado:
Segunda-feira
Realizado:
Quarta-feira
Isso NÃO deve ser considerado necessariamente um problema.
O sistema deve registrar:
"Planejado originalmente para segunda-feira e realizado na quarta-feira."
O histórico real nunca deve ser apagado por uma mudança de planejamento.
22. ADERÊNCIA AO PLANEJAMENTO
Criar um indicador simples:
Aderência
Planejado:
10 sessões
Realizado:
8 sessões
Aderência:
80%
Mas NÃO transformar isso em uma nota de desempenho ou punição.
O objetivo é apenas ajudar o usuário a entender sua rotina.
23. HISTÓRICO
Criar uma área:
HISTÓRICO DE ESTUDOS
Mostrar:
Data
Matéria
Assunto
Tempo estudado
Observações
Permitir filtrar por:
Dia
Semana
Mês
Matéria
Concurso
24. RELATÓRIO SEMANAL
Criar um resumo semanal:
Minha semana
Horas planejadas:
25h
Horas realizadas:
21h40
Sessões:
18
Matérias estudadas:
7
Conteúdos concluídos:
12
Revisões realizadas:
8
Pendências:
3
Mostrar também uma comparação com a semana anterior.
25. ORGANIZAÇÃO POR CONCURSO
Se o usuário possuir mais de um concurso, permitir selecionar:
Concurso ativo
Exemplo:
[ Polícia Federal — Agente ▼ ]
Quando um concurso estiver selecionado, mostrar somente:
Matérias daquele concurso
Conteúdos daquele edital
Progresso daquele edital
Próximas datas
Planejamento relacionado
Também permitir visualizar:
Todos os concursos
26. CONFIGURAÇÕES GERAIS
Criar:
CONFIGURAÇÕES
Planejamento
Tipo de calendário
Dias da semana
Quantidade de matérias por dia
Semana modelo
Ciclo de estudos
Estudos
Meta semanal de horas
Meta mensal de horas
Duração padrão das sessões
Revisões
Intervalos padrão
Ativar/desativar lembretes
Dashboard
Permitir escolher quais cards aparecem.
Aparência
Tema claro
Tema escuro
Cor principal
Cores das matérias
27. EXPERIÊNCIA DO USUÁRIO
A aplicação deve ser rápida e simples.
O usuário deve conseguir:
Pela manhã:
Abrir "Hoje".
Ver o planejamento.
Começar a primeira matéria.
Durante o estudo:
Iniciar cronômetro.
Estudar.
Finalizar.
Salvar.
À noite:
Ver:
Horas estudadas
Pendências
Revisões
Progresso
No início da semana:
Abrir planejamento.
Arrastar matérias.
Reorganizar.
Salvar.
Quando sair um novo concurso:
Cadastrar concurso.
Adicionar edital.
Associar matérias.
Começar planejamento.
28. O QUE NÃO IMPLEMENTAR
NÃO transformar a aplicação em:
Banco de questões
Plataforma de questões
Cursinho
Repositório de PDFs
Plataforma de videoaulas
Sistema de correção de questões
Sistema complexo de análise de desempenho em questões
O foco é:
ORGANIZAR → PLANEJAR → REGISTRAR → ACOMPANHAR
29. PRINCÍPIO FUNDAMENTAL
A aplicação deve se adaptar ao concurseiro.
O concurseiro NÃO deve ficar refém da aplicação.
Se eu mudar meus horários:
Posso reorganizar.
Se eu perder um dia:
Não perco a semana.
Se eu mudar de concurso:
Posso trocar o concurso ativo.
Se surgir uma nova matéria:
Posso cadastrar.
Se eu quiser estudar uma matéria em outro dia:
Arrasto.
Se eu quiser mudar de calendário:
Alterar nas configurações.
Se eu quiser trabalhar por ciclo:
Ativo o ciclo.
Se eu quiser trabalhar por semana:
Volto para o planejamento semanal.
30. VISÃO FINAL DO PRODUTO
A aplicação deve parecer uma mistura de:
Planner de estudos + calendário flexível + controle de edital + agenda de concursos + diário de estudos.
O objetivo é que, ao abrir a aplicação, o usuário saiba imediatamente:
O que tenho que fazer hoje?
O que eu fiz?
O que ficou pendente?
O que preciso revisar?
Quanto já avancei no edital?
Quando é minha próxima prova?
O que preciso resolver nos próximos dias?
E que consiga reorganizar tudo rapidamente através de uma interface visual, principalmente utilizando drag and drop.
Priorizar:
Simplicidade
Fluidez
Personalização
Clareza
Flexibilidade
Persistência dos dados
Facilidade de reorganização
A aplicação deve ter uma interface moderna, limpa e profissional, mas continuar visualmente inspirada na lógica da planilha de referência enviada.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://concourse-buddy-pro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3fdd60e4-2c07-478f-b4a1-dfdf4730aa07).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
