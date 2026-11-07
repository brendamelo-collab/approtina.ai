# Rotina.ai - Plano de Atualização das Funcionalidades e Fluxos Familiar & Saúde

Plano detalhado para integrar os novos requisitos de **recorrência em datas de saúde**, **alarmes inteligentes com repetição de voz a cada 10 segundos**, **relatório de evolução de medições com gráficos**, **código de vínculo para núcleos familiares** e **reorganização de Tarefas Recorrentes integradas à Rotina Diária e Agenda**.

---

## Decisões Confirmadas com o Utilizador

> [!IMPORTANT]
> As escolhas confirmadas pelo utilizador orientam a implementação exata destas atualizações:

1. **Alarme Inteligente em Voz**: Anúncio de voz repetido a cada 10 segundos seguido de um bip áudio suave até que o utilizador interaja com os botões *Viu*, *Fez* ou *Adiar*.
2. **Tarefas Recorrentes & Rotinas**: Encaixe automático na linha do tempo da **Rotina Diária** pelo dia da semana e horário configurado, com chave seletora (*Toggle*) para decidir se a tarefa recorrente aparece no calendário da Agenda.
3. **Relatório de Evolução de Saúde**: Exibição de gráfico de linha de tendência de medições (peso, pressão arterial, etc.) acompanhado do histórico escrito comparativo por membro da família.

---

## 1. Visão Geral das Novas Funcionalidades

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Fluxo de Integrações                              │
│                                                                              │
│  [Tarefas Recorrentes & Hábitos] ──┬──> [Rotina Diária (Horário + Dia)]       │
│                                     └──> [Agenda / Calendário (Opção Toggle)]│
│                                                                              │
│  [Módulo Saúde] ────────────────────┬──> [Datas Recorrentes (ex: Anual)]     │
│                                     └──> [Gráfico de Evolução de Medições]   │
│                                                                              │
│  [Alarme Inteligente (Global)] ───────> [Voz + Bip a cada 10s]              │
│                                                                              │
│  [Perfil Familiar] ───────────────────> [Fantasma (Nome) vs Código Vinculado]│
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detalhamento Técnico e de Interface por Módulo

### 2.1. Módulo Saúde: Datas Recorrentes & Status Edital
- **Recorrência em Datas**: Adicionar campos de periodicidade nas datas de saúde (ex: *Anual - Todo mês de Setembro*, *Semestral*, *Personalizado*).
- **Avanço Automático de Ciclo**: Ao marcar uma data recorrente como realizada (ex: *Exame de Sangue - Setembro 2026*), o sistema atualiza automaticamente o próximo prazo para a data futura (ex: *Setembro 2027*).
- **Status Edital / Prazos**: Exibir badge de status de acompanhamento médico e progresso de exames do ciclo.

### 2.2. Relatório de Evolução de Medições e Peso com Gráficos
- **Visualização Visual & Escrita**: Na aba de *Anotações de Saúde*, criar botão para abrir o **Relatório de Evolução de Saúde**.
- **Gráfico de Linha de Tendência**: Renderizar gráfico SVG suave mostrando a evolução histórica de medições (ex: peso em kg, pressão arterial, glicemia) por membro da família.
- **Tabela de Dados Escritos**: Histórico cronológico comparativo das medições com indicação de aumento, queda ou estabilidade.

### 2.3. Alarme Inteligente por Voz com Repetição a cada 10s
- **Suporte Universal**: Disponível para qualquer tarefa de rotina e medicamento configurado.
- **Intervalo de Anúncio**: Ao abrir o modal `<AlarmBalloonModal />`, o Web Speech API fala a instrução (ex: *"Lembrete para Brenda: Tomar Ômega 3"*) e dispara um bip suave (Web Audio API). O ciclo se repete a cada 10 segundos até o clique em *Já Vi*, *Fez / Tomou* ou *Adiar*.

### 2.4. Membros da Família & Código de Vínculo do Núcleo
- **Membro Fantasma**: Perfil simples apenas com nome e papel para organização local.
- **Membro Real / Conta Vinculada**: Aba de compartilhamento familiar exibindo o **Código do Núcleo Familiar** (ex: `ROTINA-FAM-8492`) e campo para inserir código ou e-mail de outro membro, permitindo sincronizar os dados da família.

### 2.5. Reestruturação das Tarefas Recorrentes & Módulo Rotinas
- **Remoção do Histórico em Tarefas Recorrentes**: Eliminar o acordeão de histórico de concluídas da visualização de tarefas recorrentes.
- **Visualização por Dias da Semana**: Apresentar grade organizada por dias da semana (Segunda a Domingo) para adicionar e editar tarefas de cada dia.
- **Chave "Exibir no Calendário"**: Toggle em cada tarefa recorrente para escolher se ela é visível no calendário da Agenda.
- **Encaixe Automático na Rotina Diária**: Tarefas recorrentes configuradas com dia da semana e horário são integradas automaticamente na linha do tempo da Rotina Diária.
- **Limpeza no Módulo Rotinas**: Remover a seção isolada de *Hábitos e Tarefas* de dentro de Rotinas (agora unificada nas Tarefas Recorrentes).

---

## 3. Plano de Execução

1. **Atualizar Tipos & AppContext** (`src/types/index.ts`, `src/context/AppContext.tsx`):
   - Adicionar `isRecurring`, `recurrenceInterval`, `nextDate` em `HealthDateItem`.
   - Adicionar `showOnCalendar` em `RecurringTaskItem`.
   - Implementar temporizador de repetição a cada 10s em `AppContext` para voz + bip no `activeAlarm`.
   - Adicionar gerador de código de vínculo familiar em `profiles`.
2. **Atualizar Modal de Alarme** (`src/components/AlarmBalloonModal.tsx`):
   - Integrar loop de repetição de voz + som de bip a cada 10s.
3. **Atualizar Módulo Saúde** (`src/components/views/SaudeView.tsx`):
   - Adicionar suporte a recorrência em datas de saúde com renovação de ciclo.
   - Adicionar modal do Relatório de Evolução de Medições com gráfico de linha SVG e dados escritos por membro.
4. **Atualizar Módulo Tarefas Recorrentes** (`src/components/views/TarefasRecorrentesView.tsx`):
   - Remover lista de histórico.
   - Adicionar visualização por dias da semana (Segunda a Domingo).
   - Adicionar toggle `Exibir na Agenda`.
5. **Atualizar Módulo Rotinas & Agenda** (`src/components/views/RotinasView.tsx`, `src/components/views/AgendaView.tsx`):
   - Encaixar tarefas recorrentes do dia na linha do tempo cronológica da Rotina Diária.
   - Filtrar exibição da Agenda pelas tarefas recorrentes que possuem `showOnCalendar = true`.
6. **Atualizar Configurações & Perfil** (`src/components/views/ConfiguracoesPerfilView.tsx`):
   - Exibir Código do Núcleo Familiar e modal de conexão para membros reais.
7. **Verificação & Testes**:
   - Executar `compile_applet` e `lint_applet` para validar ausência de erros.
