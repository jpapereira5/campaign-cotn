// Gera docs/estado.md a partir do registo: node scripts/estado.ts [--check]
// É a página de consulta no telemóvel: o que está aberto, quem tem o quê, relógios, planos, próxima sessão.
// Nunca se edita à mão. Com erros no registo não escreve (o validador diz quais). --check: não escreve; sai com
// código 1 se o ficheiro estiver desatualizado. gerarEstado() é também usada pelo validador para esse aviso.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Canon } from '../src/lib/types.ts'
import { derivar, validateRegisto, DESTINOS_ESPECIAIS, type Momento, type Registo } from '../src/lib/registo.ts'
import { carregar, docs } from './carregar.ts'

export function gerarEstado(canon: Canon, registo: Registo): string {
  const e = derivar(canon, registo)
  const nome = (id: string): string =>
    canon.characters.find((c) => c.id === id)?.name ??
    canon.factions.find((f) => f.id === id)?.name ??
    canon.locations.find((l) => l.id === id)?.name ??
    canon.beats.find((b) => b.id === id)?.title ??
    registo.itens.find((i) => i.id === id)?.nome ??
    registo.fios.find((f) => f.id === id)?.titulo ??
    registo.relogios.find((r) => r.id === id)?.nome ??
    id
  const cap = (id: string) => canon.campaign.chapters.find((c) => c.id === id)?.name ?? id
  const momento = (m?: Momento) => (m ? `dia ${m.dia}${m.terco ? `, ${m.terco}` : ''}` : '')
  const pcs = new Set(canon.characters.filter((c) => c.kind === 'pc').map((c) => c.id))
  const out: string[] = []
  const h = (s: string) => out.push('', `## ${s}`, '')
  out.push('# Estado da campanha', '', '_Gerado por `npm run estado` a partir de `data/registo` — não editar; o que está errado corrige-se no registo ou numa linha em `docs/caixa.md`._')

  h('Sessões')
  for (const s of e.sessoes) {
    const tempo = s.tempo ? ` · ${momento(s.tempo.de)} → ${momento(s.tempo.a)}${s.tempo.estimado ? ' (estimado)' : ''}` : ''
    out.push(`- **${s.id}** (#${s.global ?? '?'}, ${s.data}) — ${s.titulo} · ${cap(s.capitulo)}${tempo}${s.resumo ? ` · [resumo](../${s.resumo})` : ''}`)
  }
  if (e.planeada) {
    const p = e.planeada
    out.push(`- **Próxima: ${p.id}** (${p.data || 'data por marcar'})${p.titulo ? ` — ${p.titulo}` : ''} · ${cap(p.capitulo)} · beats previstos: ${p.beats.map((b) => nome(b.id)).join(', ') || '—'}${p.preparacao ? ` · preparação: ${p.preparacao}` : ''}`)
  } else out.push('- _Sem sessão planeada._')
  if (e.capituloAtual) out.push('', `A mesa está em **${cap(e.capituloAtual)}**${e.momentoAtual ? `, ${momento(e.momentoAtual)}` : ''}.`)

  h('Fios abertos')
  const abertos = registo.fios.filter((f) => e.fios[f.id]?.estado === 'aberto')
  for (const tipo of ['fio', 'pergunta'] as const) {
    const lista = abertos.filter((f) => f.tipo === tipo)
    if (!lista.length) continue
    out.push(`**${tipo === 'fio' ? 'Fios' : 'Perguntas ao DM'}** (${lista.length})`, '')
    for (const f of lista) {
      const d = e.fios[f.id]
      const ultimo = d.movimentos[d.movimentos.length - 1]
      out.push(`- \`${f.id}\` ${f.titulo} — sobre ${f.sobre.map(nome).join(', ') || '—'} · aberto em ${f.aberto}${ultimo && ultimo.tipo !== 'abre' ? ` · último: ${ultimo.onde}, ${ultimo.texto}` : ''}${f.prazo ? ` · prazo: ${f.prazo}` : ''}`)
    }
    out.push('')
  }
  if (!abertos.length) out.push('_Nenhum._')

  h('Quem tem o quê')
  const especiais = new Set<string>(DESTINOS_ESPECIAIS)
  const donos = Object.entries(e.inventario)
    .filter(([d]) => !especiais.has(d) || d === 'grupo')
    .sort(([a], [b]) => Number(!pcs.has(b)) - Number(!pcs.has(a)) || nome(a).localeCompare(nome(b)))
  for (const [dono, inv] of donos) out.push(`- **${dono === 'grupo' ? 'O grupo' : nome(dono)}**${pcs.has(dono) || dono === 'grupo' ? '' : ' (fora do grupo)'}: ${inv.itens.map(nome).join(', ') || '—'}${inv.ouro ? ` · ${inv.ouro} po` : ''}`)
  if (!donos.length) out.push('_Nada registado._')
  const fora = ['perdido', 'gasto'].filter((d) => e.inventario[d]?.itens.length)
  for (const d of fora) out.push(`- _${d === 'perdido' ? 'Perdidos' : 'Gastos'}_: ${e.inventario[d].itens.map(nome).join(', ')}`)
  const handouts = registo.itens.filter((i) => i.tipo === 'handout')
  if (handouts.length) {
    out.push('', '**Handouts**', '')
    for (const hd of handouts) {
      const entrega = e.donos[hd.id] ? `entregue a ${nome(e.donos[hd.id])}` : `por entregar${hd.para.length ? ` (para ${hd.para.map(nome).join(', ')})` : ''}`
      out.push(`- ${hd.nome}: ${entrega}${hd.texto || hd.drive ? '' : ' · por escrever'}`)
    }
  }

  h('Relógios')
  for (const r of registo.relogios) {
    const p = e.relogios[r.id]
    out.push(`- **${r.nome}**: ${p ? p.posicao : 0}/${r.passos}${r.unidade ? ` ${r.unidade}` : ''}${p?.sessao ? ` (desde ${p.sessao})` : ''}${r.prazo ? ` · prazo: ${r.prazo}` : ''}${p && p.posicao >= r.passos ? ' · **terminado**' : ''}`)
  }
  if (!registo.relogios.length) out.push('_Nenhum._')

  h('Planos por cumprir')
  for (const d of e.decisoes.planos) out.push(`- \`${d.id}\` ${d.texto}${d.gatilho.length ? ` · quando: ${d.gatilho.map(nome).join(' / ')}` : ''}${d.prazo ? ` · prazo: ${d.prazo}` : ''}${d.quando ? ` · ${d.quando}` : ''}`)
  if (!e.decisoes.planos.length) out.push('_Nenhum._')

  h('NPCs: último estado')
  const npcs = Object.entries(e.npcs).sort(([a], [b]) => nome(a).localeCompare(nome(b)))
  for (const [id, n] of npcs) out.push(`- **${nome(id)}** (${n.sessaoEstado ?? n.sessao}): ${[n.estado, n.atitude].filter(Boolean).join(' · ')}`)
  if (!npcs.length) out.push('_Nada registado._')

  h('Flags ativas')
  out.push(Object.keys(e.flags).length ? Object.keys(e.flags).sort().map((f) => `\`${f}\``).join(' · ') : '_Nenhuma._')

  h('Revelações dadas à mesa')
  for (const [r, s] of e.revelados) out.push(`- ${nome(r)} (${s})`)
  if (!e.revelados.size) out.push('_Nenhuma._')

  h('Propostas herdadas por capítulo')
  const porCap = new Map<string, string[]>()
  for (const b of canon.beats) if (b.proposta) porCap.set(b.chapter, [...(porCap.get(b.chapter) ?? []), b.id])
  for (const [c, ids] of [...porCap.entries()].sort()) out.push(`- ${cap(c)}: ${ids.length} — ${ids.join(', ')}`)
  if (!porCap.size) out.push('_Nenhuma._')

  return out.join('\n') + '\n'
}

/** Compara ignorando fins de linha (o git no Windows pode gravar CRLF). */
export function estadoDesatualizado(texto: string): boolean {
  const path = join(docs, 'estado.md')
  const atual = existsSync(path) ? readFileSync(path, 'utf8').replace(/\r\n/g, '\n') : ''
  return atual !== texto
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { canon, registo, problems } = carregar()
  const erros = [...problems, ...validateRegisto(canon, registo)].filter((p) => p.level === 'error')
  if (erros.length) {
    for (const p of erros) console.error(`✖ ${p.where}: ${p.message}`)
    console.error(`docs/estado.md não foi escrito: ${erros.length} erro(s) no cânone ou no registo (npm run validate)`)
    process.exitCode = 1
  } else {
    const texto = gerarEstado(canon, registo)
    if (process.argv.includes('--check')) {
      if (estadoDesatualizado(texto)) {
        console.error('docs/estado.md está desatualizado: corre npm run estado')
        process.exitCode = 1
      } else console.log('docs/estado.md atualizado')
    } else {
      writeFileSync(join(docs, 'estado.md'), texto)
      console.log(`docs/estado.md escrito (${texto.split('\n').length} linhas)`)
    }
  }
}
