"""Gera src/themes.css: as paletas alternativas do Rotina.ai.

A paleta Bege (padrão, sem data-theme) NÃO é alterada: este arquivo só tem regras
dentro de [data-theme="..."]. Cada cor fixa usada nas telas (ex.: bg-[#FAF8F5]) recebe
um "papel" (fundo, cartão, texto, destaque...) e cada paleta define a cor de cada papel.
Assim nenhuma cor marrom/bege da paleta padrão sobra misturada nas outras paletas.

Uso: python3 tools/themes/generate-themes.py   (rode na raiz do projeto)
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(SRC, 'themes.css')

# Papel de cada cor da paleta Bege
ROLES = {
    'page': ['FDFBF7', 'FCFAF6'],
    'card': ['FAF8F5', 'F9F6F1', 'F9F6F0', 'FAF6F0', 'FAF5EE', 'FAF5ED'],
    'soft': ['F7F4EE', 'F7F2EA', 'F7F1E6', 'F6EFE6', 'F5ECE2', 'F5ECE0', 'F3ECE0', 'F2ECE2', 'F2ECE0', 'F0ECE4',
             'F7EEE3', 'F4EDE2', 'F7EDE4', 'F1E8DA', 'F9F4EB', 'FAF2EB', 'F6E9DC'],
    'line': ['EFE8DE', 'EAE3D6', 'ECE3D5', 'E2DDD3', 'E2D8CA', 'E8E2D5', 'EAE4D9', 'ECE4D4', 'EFE5D5', 'EFE4D2',
             'E8DFC8', 'EAE1D1', 'EADFCF', 'EADFCB'],
    'high': ['EAE0D2', 'E4DACD', 'DFD3C3', 'DDD3C5', 'DCD4C8', 'DCD3C5'],
    'strong': ['D8C7B4', 'C8B8A6', 'C4B6A6', 'B8AEA0'],
    'ink1': ['2C2C2C', '3C3C3C', '4A4A4A', '4A3E34'],
    'ink2': ['5C4F44', '6E5D4F', '7A6B5D'],
    'ink3': ['8C7A6B', '9E9488'],
    'muted': ['A39385', 'B4A597', 'A8988B', 'B2A396', 'A39284'],
    'accent-dark': ['786657'],
    'accent2': ['B78A58', 'C58B68', '9E6C52', 'A87053'],
    'accent2-soft': ['E6C8A8'],
    # cores de significado (positivo / negativo / atenção): só mudam no modo escuro
    'ok-ink': ['2C5230', '3B663F', '1E3B21', '487E50'],
    'ok-bg': ['EEF5EF', 'D3E4D5'],
    'ok-line': ['B7D2B9', '97C29B'],
    'ok-mid': ['7D9D7F', '6C8B6E', '68886A', '3B7A42'],
    'bad-ink': ['8C3A24', '6E2A18', '722F1D', 'A85B48', 'A85A48', 'C0563C'],
    'bad-bg': ['FDF2EE', 'F7EDE8', 'F2E5E0'],
    'bad-line': ['E8C2B8', 'F0D5CD', 'EAA598'],
    'bad-mid': ['C06C54', 'B8472E'],
    'warn-bg': ['FEF9E7'],
    'warn-ink': ['8C6D1F', '5A4510'],
    'warn-line': ['EADB9B'],
    'warn-mid': ['D4A017'],
}
# 8C7A6B é texto secundário, mas como fundo/borda/anel é a cor de destaque (botões)
ACCENT_AS_FILL = {'8C7A6B': 'accent'}

SEMANTIC_LIGHT = {
    'ok-ink': '#2C5230', 'ok-bg': '#EEF5EF', 'ok-line': '#B7D2B9', 'ok-mid': '#6E9472',
    'bad-ink': '#8C3A24', 'bad-bg': '#FDF2EE', 'bad-line': '#E8C2B8', 'bad-mid': '#B8563E',
    'warn-bg': '#FEF9E7', 'warn-ink': '#7A5E14', 'warn-line': '#EADB9B', 'warn-mid': '#C9971A',
}

PALETTES = {
    # Rosé suave: rosa antigo com terracota clara
    'nude': {
        'page': '#FCF8F7', 'card': '#FFFBFA', 'soft': '#F7EDEA', 'line': '#EEDFDB', 'high': '#EBD7D1', 'strong': '#D9C0B9',
        'ink1': '#2F2628', 'ink2': '#5A4347', 'ink3': '#875D60', 'muted': '#A3878A',
        'accent': '#9A6260', 'accent-dark': '#7E4C4B', 'accent2': '#B06E62', 'accent2-soft': '#E9C9C0',
        **SEMANTIC_LIGHT,
    },
    # Verde sálvia: folhagem calma com areia
    'verde': {
        'page': '#F8FAF6', 'card': '#FCFDFB', 'soft': '#EEF3EB', 'line': '#E1E9DD', 'high': '#D6E2D1', 'strong': '#BFCFB9',
        'ink1': '#232A24', 'ink2': '#3E4C40', 'ink3': '#58705D', 'muted': '#869A88',
        'accent': '#557658', 'accent-dark': '#425D45', 'accent2': '#9A7B4E', 'accent2-soft': '#E4D8BF',
        **SEMANTIC_LIGHT,
    },
    # Azul sereno: azul acinzentado com lavanda
    'azul': {
        'page': '#F7F9FC', 'card': '#FCFDFF', 'soft': '#EDF2F8', 'line': '#DFE7F1', 'high': '#D3DEEC', 'strong': '#B9C8DB',
        'ink1': '#1F2733', 'ink2': '#3A4A5F', 'ink3': '#536A86', 'muted': '#8494AA',
        'accent': '#4C6890', 'accent-dark': '#3A5274', 'accent2': '#6F64A0', 'accent2-soft': '#DAD5EE',
        **SEMANTIC_LIGHT,
    },
    # Café escuro: fundo escuro aconchegante, textos claros
    'escuro': {
        'page': '#171412', 'card': '#211D1A', 'soft': '#2A2521', 'line': '#36302A', 'high': '#3D352E', 'strong': '#4D433B',
        'ink1': '#F2EBE3', 'ink2': '#DCCEC0', 'ink3': '#BCA997', 'muted': '#9A8C7E',
        'accent': '#8E6C4F', 'accent-dark': '#A3805F', 'accent2': '#D9A86F', 'accent2-soft': '#5B4733',
        'ok-ink': '#A3D3A9', 'ok-bg': '#1D2D21', 'ok-line': '#355239', 'ok-mid': '#72A97C',
        'bad-ink': '#F2AA95', 'bad-bg': '#35221E', 'bad-line': '#5C3429', 'bad-mid': '#D9775E',
        'warn-bg': '#332B19', 'warn-ink': '#E8C870', 'warn-line': '#5E5026', 'warn-mid': '#D6A92E',
    },
}

PALETTE_META = {
    'nude': ('#FCF8F7', '#FFFBFA', '#9A6260'),
    'verde': ('#F8FAF6', '#FCFDFB', '#557658'),
    'azul': ('#F7F9FC', '#FCFDFF', '#4C6890'),
    'escuro': ('#171412', '#211D1A', '#D9A86F'),
}

HEX_ROLE = {h: r for r, hs in ROLES.items() for h in hs}
PROP = {'bg': 'background-color', 'text': 'color', 'border': 'border-color', 'fill': 'fill', 'stroke': 'stroke',
        'ring': '--tw-ring-color', 'from': '--tw-gradient-from', 'to': '--tw-gradient-to', 'via': '--tw-gradient-via',
        'outline': 'outline-color', 'decoration': 'text-decoration-color', 'divide': 'border-color'}
STATES = {'hover': ':hover', 'focus': ':focus', 'focus-visible': ':focus-visible', 'active': ':active',
          'group-hover': None, 'placeholder': '::placeholder'}

CLASS_RE = re.compile(r'((?:[a-z-]+:)*)(bg|text|border|fill|stroke|ring|from|to|via|outline|decoration|divide)-\[#([0-9A-Fa-f]{6})\](?:/(\d+))?')


def esc(cls):
    return re.sub(r'([:\[\]#/.%])', r'\\\1', cls)


def collect():
    found = set()
    for base, _d, files in os.walk(SRC):
        for f in files:
            if f.endswith(('.tsx', '.ts')):
                with open(os.path.join(base, f), encoding='utf-8') as fh:
                    for m in CLASS_RE.finditer(fh.read()):
                        found.add(m.group(0))
    return sorted(found)


def rule_for(cls):
    m = CLASS_RE.fullmatch(cls)
    prefixes, kind, hx, alpha = m.group(1), m.group(2), m.group(3).upper(), m.group(4)
    role = HEX_ROLE.get(hx)
    if not role:
        return None
    if hx in ACCENT_AS_FILL and kind in ('bg', 'border', 'ring', 'from', 'to', 'via', 'outline'):
        role = ACCENT_AS_FILL[hx]
    pseudo = ''
    for p in [x for x in prefixes.split(':') if x]:
        if p not in STATES:
            return None  # variants like sm:, before:, selection: are left as they are
        if p == 'group-hover':
            return None
        pseudo += STATES[p]
    value = f'var(--t-{role})'
    if alpha:
        value = f'color-mix(in srgb, var(--t-{role}) {alpha}%, transparent)'
    sel = '.' + esc(cls) + pseudo
    prop = PROP[kind]
    if kind == 'divide':
        sel += ' > :not(:last-child)'
    return sel, f'{prop}: {value} !important;'


def main():
    classes = collect()
    lines = [
        '/* ARQUIVO GERADO por tools/themes/generate-themes.py: edite o script, não este arquivo. */',
        '/* Paletas alternativas. A paleta Bege (padrão) não usa data-theme e não é afetada. */',
        '',
    ]
    for name, pal in PALETTES.items():
        lines.append(f'[data-theme="{name}"] {{')
        for role in ['page', 'card', 'soft', 'line', 'high', 'strong', 'ink1', 'ink2', 'ink3', 'muted', 'accent',
                     'accent-dark', 'accent2', 'accent2-soft', 'ok-ink', 'ok-bg', 'ok-line', 'ok-mid', 'bad-ink',
                     'bad-bg', 'bad-line', 'bad-mid', 'warn-bg', 'warn-ink', 'warn-line', 'warn-mid']:
            lines.append(f'  --t-{role}: {pal[role]};')
        # variáveis antigas, ainda usadas em alguns pontos
        lines += [
            f'  --bg-cream: {pal["page"]};', f'  --card-beige: {pal["card"]};', f'  --card-beige-alt: {pal["soft"]};',
            f'  --card-border: {pal["line"]};', f'  --text-primary: {pal["ink1"]};', f'  --text-secondary: {pal["ink3"]};',
            f'  --text-dark: {pal["ink2"]};', f'  --text-muted: {pal["muted"]};', f'  --accent-earth: {pal["accent"]};',
            f'  --accent-earth-dark: {pal["accent-dark"]};', f'  --accent-warm-soft: {pal["soft"]};',
            f'  --accent-caramel: {pal["accent2"]};', f'  --accent-highlight: {pal["high"]};', f'  --modal-bg: {pal["page"]};',
        ]
        if name == 'escuro':
            lines.append('  color-scheme: dark;')
        lines.append('}')
    lines.append('')
    themed = ', '.join(f'[data-theme="{n}"]' for n in PALETTES)
    lines += [
        f':is({themed}), :is({themed}) body, :is({themed}) main, :is({themed}) .min-h-screen {{',
        '  background-color: var(--t-page) !important;',
        '  color: var(--t-ink1);',
        '}',
        '',
    ]
    rules = {}
    for cls in classes:
        r = rule_for(cls)
        if r:
            rules.setdefault(r[1], []).append(r[0])
    for decl, sels in sorted(rules.items()):
        sel = ',\n'.join(f':is({themed}) {s}' for s in sorted(set(sels)))
        lines.append(f'{sel} {{ {decl} }}')
    # Gráficos em SVG com cor fixa nos atributos (stroke="#EFE8DE", fill=..., stop-color=...)
    for attr, prop in (('stroke', 'stroke'), ('fill', 'fill'), ('stop-color', 'stop-color')):
        for hx, role in sorted(HEX_ROLE.items()):
            r = 'accent' if hx in ACCENT_AS_FILL else role
            lines.append(f':is({themed}) [{attr}="#{hx}" i] {{ {prop}: var(--t-{r}); }}')
    # Modo escuro: superfícies brancas do Tailwind viram cartões; botões de destaque mantêm texto claro
    lines += [
        '',
        '[data-theme="escuro"] .bg-white { background-color: var(--t-card) !important; }',
        '[data-theme="escuro"] .bg-white\\/70, [data-theme="escuro"] .bg-white\\/80, [data-theme="escuro"] .bg-white\\/60, [data-theme="escuro"] .bg-white\\/90 { background-color: color-mix(in srgb, var(--t-card) 85%, transparent) !important; }',
        '[data-theme="escuro"] .hover\\:bg-white:hover { background-color: var(--t-soft) !important; }',
        '[data-theme="escuro"] .border-white { border-color: var(--t-line) !important; }',
        '[data-theme="escuro"] input, [data-theme="escuro"] textarea, [data-theme="escuro"] select { color: var(--t-ink1); }',
        '[data-theme="escuro"] ::placeholder { color: var(--t-muted); }',
        '[data-theme="escuro"] .text-black { color: var(--t-ink1) !important; }',
        '',
    ]
    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines) + '\n')
    print(f'{len(classes)} classes; {sum(len(v) for v in rules.values())} regras -> {OUT}')
    unknown = sorted({CLASS_RE.fullmatch(c).group(3).upper() for c in classes} - set(HEX_ROLE))
    print('cores sem papel (ficam iguais em todas as paletas):', ' '.join(unknown))


if __name__ == '__main__':
    main()
