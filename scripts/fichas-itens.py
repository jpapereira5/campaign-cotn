#!/usr/bin/env python3
"""Fichas de itens para recortar e entregar à mesa (A4, grelha de 3 colunas).

Uso:
  python3 scripts/fichas-itens.py <itens.yaml> <saida.pdf>
  python3 scripts/fichas-itens.py --modelo <saida.pdf>   # página de fichas em branco

Formato do YAML (uma lista; só `nome` é obrigatório):

  - nome: Lupa das Entrelinhas
    tipo: Item maravilhoso, incomum (não precisa de sintonização)
    aspeto: Uma lente de cristal num aro de latão gasto...
    propriedades:
      - titulo: Ver o escrito escondido
        texto: Pela lupa, até 30 cm, vês tinta invisível...
      - texto: Ocupa uma mão.
    rodape: Forte Ventura · S8

No texto, *itálico* e **negrito**. Cada ficha ocupa a largura de uma coluna e
nunca se parte; o que não cabe passa à coluna ou à página seguinte. As linhas
tracejadas são as de corte.
"""
import re
import sys

import yaml
from reportlab.lib.colors import Color, black
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph

PAGINA_L, PAGINA_A = A4
MARGEM = 10 * mm
COLUNAS = 3
INTERVALO = 4 * mm          # entre colunas e entre fichas (espaço para a tesoura)
PADDING = 3.5 * mm
COLUNA_L = (PAGINA_L - 2 * MARGEM - (COLUNAS - 1) * INTERVALO) / COLUNAS
TEXTO_L = COLUNA_L - 2 * PADDING
CINZA = Color(0.45, 0.45, 0.45)
LINHA = Color(0.25, 0.25, 0.25)

FONTE = 'Times-Roman'
FONTE_B = 'Times-Bold'
FONTE_I = 'Times-Italic'

E_NOME = ParagraphStyle('nome', fontName=FONTE_B, fontSize=11.5, leading=13.5)
E_TIPO = ParagraphStyle('tipo', fontName=FONTE_I, fontSize=8, leading=9.6, textColor=CINZA)
E_ASPETO = ParagraphStyle('aspeto', fontName=FONTE_I, fontSize=8.6, leading=10.6)
E_TEXTO = ParagraphStyle('texto', fontName=FONTE, fontSize=8.6, leading=10.6)
E_RODAPE = ParagraphStyle('rodape', fontName=FONTE_I, fontSize=6.8, leading=8, textColor=CINZA, alignment=2)
ESPACO = 2.2 * mm


def marcar(texto):
    """Escapa o texto e converte **negrito** e *itálico* em marcação do ReportLab."""
    texto = str(texto).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    texto = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', texto)
    texto = re.sub(r'\*(.+?)\*', r'<i>\1</i>', texto)
    return texto.replace('\n', '<br/>')


def blocos(item):
    """A lista de (tipo, Paragraph) de uma ficha, por ordem."""
    out = [('nome', Paragraph(marcar(item['nome']), E_NOME))]
    if item.get('tipo'):
        out.append(('tipo', Paragraph(marcar(item['tipo']), E_TIPO)))
    out.append(('regua', None))
    if item.get('aspeto'):
        out.append(('aspeto', Paragraph(marcar(item['aspeto']), E_ASPETO)))
    for p in item.get('propriedades') or []:
        if isinstance(p, str):
            p = {'texto': p}
        txt = marcar(p.get('texto', ''))
        if p.get('titulo'):
            txt = f'<b><i>{marcar(p["titulo"])}.</i></b> {txt}'
        out.append(('texto', Paragraph(txt, E_TEXTO)))
    if item.get('rodape'):
        out.append(('rodape', Paragraph(marcar(item['rodape']), E_RODAPE)))
    return out


def espacos(bl):
    """O espaço antes de cada bloco."""
    out, ant = [], None
    for tipo, _ in bl:
        if tipo == 'nome':
            out.append(0)
        elif tipo == 'tipo':
            out.append(0.4 * mm)
        elif tipo == 'regua':
            out.append(1.2 * mm)
        else:
            out.append(1.4 * mm if ant == 'regua' else ESPACO)
        ant = tipo
    return out


def medir(bl):
    alturas = []
    for (tipo, par), e in zip(bl, espacos(bl)):
        h = 0.6 * mm if tipo == 'regua' else par.wrap(TEXTO_L, 10_000)[1]
        alturas.append(e + h)
    return 2 * PADDING + sum(alturas), alturas


def corte(c, x, y_topo, h):
    c.saveState()
    c.setStrokeColor(LINHA)
    c.setLineWidth(0.5)
    c.setDash(3, 2)
    c.rect(x, y_topo - h, COLUNA_L, h, stroke=1, fill=0)
    c.restoreState()


def desenhar(c, x, y_topo, bl, alturas, h_total):
    corte(c, x, y_topo, h_total)
    y = y_topo - PADDING
    for (tipo, par), e in zip(bl, espacos(bl)):
        y -= e
        if tipo == 'regua':
            c.saveState()
            c.setStrokeColor(black)
            c.setLineWidth(0.6)
            c.line(x + PADDING, y - 0.3 * mm, x + COLUNA_L - PADDING, y - 0.3 * mm)
            c.restoreState()
            y -= 0.6 * mm
        else:
            h = par.wrap(TEXTO_L, 10_000)[1]
            par.drawOn(c, x + PADDING, y - h)
            y -= h


def gerar(itens, saida, titulo='Fichas de itens'):
    c = Canvas(saida, pagesize=A4)
    c.setTitle(titulo)
    altura_util = PAGINA_A - 2 * MARGEM
    col, y = 0, PAGINA_A - MARGEM
    for item in itens:
        bl = blocos(item)
        h, alturas = medir(bl)
        if h > altura_util:
            sys.exit(f'A ficha «{item["nome"]}» não cabe numa coluna inteira; encurta o texto.')
        if y - h < MARGEM:
            col += 1
            y = PAGINA_A - MARGEM
            if col == COLUNAS:
                c.showPage()
                col = 0
        x = MARGEM + col * (COLUNA_L + INTERVALO)
        desenhar(c, x, y, bl, alturas, h)
        y -= h + INTERVALO
    c.save()


def modelo(saida):
    """Uma página de fichas em branco, para preencher à mão."""
    c = Canvas(saida, pagesize=A4)
    c.setTitle('Fichas de itens (em branco)')
    h = (PAGINA_A - 2 * MARGEM - 2 * INTERVALO) / 3
    for col in range(COLUNAS):
        for lin in range(3):
            x = MARGEM + col * (COLUNA_L + INTERVALO)
            y_topo = PAGINA_A - MARGEM - lin * (h + INTERVALO)
            corte(c, x, y_topo, h)
            c.setFont(FONTE_I, 7)
            c.setFillColor(CINZA)
            c.drawString(x + PADDING, y_topo - PADDING - 7, 'Nome')
            c.drawString(x + PADDING, y_topo - PADDING - 24, 'Tipo, raridade, sintonização')
            c.setStrokeColor(black)
            c.setLineWidth(0.6)
            c.line(x + PADDING, y_topo - PADDING - 30, x + COLUNA_L - PADDING, y_topo - PADDING - 30)
            c.setStrokeColor(Color(0.8, 0.8, 0.8))
            c.setLineWidth(0.4)
            yy = y_topo - PADDING - 30 - 13
            while yy > y_topo - h + PADDING:
                c.line(x + PADDING, yy, x + COLUNA_L - PADDING, yy)
                yy -= 13
    c.save()


if __name__ == '__main__':
    args = sys.argv[1:]
    if len(args) == 2 and args[0] == '--modelo':
        modelo(args[1])
    elif len(args) == 2:
        with open(args[0], encoding='utf-8') as f:
            dados = yaml.safe_load(f)
        itens = dados['itens'] if isinstance(dados, dict) else dados
        titulo = dados.get('titulo', 'Fichas de itens') if isinstance(dados, dict) else 'Fichas de itens'
        gerar(itens, args[1], titulo)
    else:
        sys.exit(__doc__)
