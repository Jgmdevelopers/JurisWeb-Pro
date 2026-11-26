from pathlib import Path
import subprocess
import json
import re

ruta = Path("index.html")

contenido = ruta.read_text(encoding="utf-8")

if "data-texto=" in contenido:
    raise SystemExit(
        "El HTML ya contiene campos editoriales."
    )

# Obtener la configuracion editorial desde Node.js.

codigo_js = """
const fs = require("node:fs");
const vm = require("node:vm");

const contexto = { window: {} };

vm.runInNewContext(
  fs.readFileSync("config/estudio.js", "utf8"),
  contexto
);

console.log(
  JSON.stringify(contexto.window.ESTUDIO.textos)
);
"""

resultado = subprocess.run(
    ["node", "-e", codigo_js],
    capture_output=True,
    text=True,
    encoding="utf-8",
    check=True
)

textos = json.loads(resultado.stdout)


def reemplazar_unico(html, patron, reemplazo, campo):

    resultado, cantidad = re.subn(
        patron,
        reemplazo,
        html,
        flags=re.DOTALL
    )

    if cantidad != 1:
        raise SystemExit(
            f"Error en {campo}: "
            f"se esperaba 1 coincidencia, "
            f"se encontraron {cantidad}."
        )

    return resultado


def obtener_texto(campo):

    valor = textos

    for propiedad in campo.split("."):
        valor = valor[propiedad]

    return valor


def patron_texto(texto):

    return r"\s+".join(
        re.escape(parte)
        for parte in texto.split()
    )


def marcar_texto(html, etiqueta, campo):

    texto = obtener_texto(campo)

    patron = (
        rf"(<{etiqueta}\b[^>]*)(>)"
        rf"(\s*{patron_texto(texto)}\s*)"
        rf"(</{etiqueta}\s*>)"
    )

    return reemplazar_unico(
        html,
        patron,
        lambda m:
            m.group(1) +
            f' data-texto="{campo}"' +
            m.group(2) +
            m.group(3) +
            m.group(4),
        campo
    )


def modificar_bloque(
    html,
    etiqueta,
    identificador,
    campos
):

    patron = (
        rf'<{etiqueta}\b'
        rf'(?=[^>]*\bid="{identificador}")'
        rf'[^>]*>.*?</{etiqueta}\s*>'
    )

    def aplicar(m):

        bloque = m.group(0)

        for tipo, campo in campos:

            bloque = marcar_texto(
                bloque,
                tipo,
                campo
            )

        return bloque

    return reemplazar_unico(
        html,
        patron,
        aplicar,
        identificador
    )


# Encabezado.

contenido = modificar_bloque(
    contenido,
    "header",
    "encabezado",
    [
        ("a", "encabezado.inicio"),
        ("a", "encabezado.estudio"),
        ("a", "encabezado.areas"),
        ("a", "encabezado.equipo"),
        ("a", "encabezado.contacto"),
        ("a", "encabezado.cta"),
    ]
)


# Hero.

contenido = modificar_bloque(
    contenido,
    "section",
    "inicio",
    [
        ("h1", "hero.titulo"),
        ("p", "hero.descripcion"),
        ("a", "hero.ctaPrincipal"),
        ("a", "hero.ctaSecundaria"),
    ]
)

etiqueta_hero = obtener_texto(
    "hero.etiqueta"
)

contenido = reemplazar_unico(
    contenido,
    patron_texto(etiqueta_hero) + r"\s*·",
    lambda m:
        '<span data-texto="hero.etiqueta">' +
        etiqueta_hero +
        '</span> ·',
    "hero.etiqueta"
)


# Estudio.

contenido = modificar_bloque(
    contenido,
    "section",
    "estudio",
    [
        ("p", "estudio.etiqueta"),
        ("h2", "estudio.titulo"),
        ("figcaption", "estudio.leyenda"),

        (
            "h3",
            "estudio.valores.confidencialidad.titulo"
        ),
        (
            "p",
            "estudio.valores.confidencialidad.descripcion"
        ),

        (
            "h3",
            "estudio.valores.comunicacion.titulo"
        ),
        (
            "p",
            "estudio.valores.comunicacion.descripcion"
        ),

        (
            "h3",
            "estudio.valores.rigor.titulo"
        ),
        (
            "p",
            "estudio.valores.rigor.descripcion"
        ),
    ]
)


# Secciones con encabezados comunes.

for seccion in [
    "areas",
    "equipo",
    "consulta",
    "preguntas",
    "contacto",
]:

    campos = [
        ("p", f"{seccion}.etiqueta"),
        ("h2", f"{seccion}.titulo"),
        ("p", f"{seccion}.descripcion"),
    ]

    if seccion == "preguntas":

        campos.extend([
            ("h3", "preguntas.contactoTitulo"),
            ("p", "preguntas.contactoDescripcion"),
        ])

    if seccion == "contacto":

        campos.extend([
            ("h3", "contacto.ubicacion"),
            ("h3", "contacto.horarios"),
            ("h3", "contacto.modalidad"),
            ("h3", "contacto.canales"),
            ("h4", "contacto.tituloAlternativo"),
        ])

    contenido = modificar_bloque(
        contenido,
        "section",
        seccion,
        campos
    )


# Footer.

contenido = modificar_bloque(
    contenido,
    "footer",
    "pie-pagina",
    [
        ("h2", "footer.navegacionTitulo"),
        ("h2", "footer.informacionTitulo"),
        ("a", "footer.inicio"),
        ("a", "footer.estudio"),
        ("a", "footer.areas"),
        ("a", "footer.equipo"),
        ("a", "footer.consulta"),
        ("a", "footer.preguntas"),
        ("a", "footer.contacto"),
    ]
)


# Botones que contienen flechas.

botones = [
    ("estudio-cta", "estudio.cta"),
    ("consulta-cta", "consulta.cta"),
    ("preguntas-cta", "preguntas.cta"),
    ("footer-cta", "footer.cta"),
    ("footer-volver", "footer.volver"),
]

for clase, campo in botones:

    patron = (
        rf'<a\b'
        rf'(?=[^>]*class="{clase}")'
        rf'[^>]*>.*?</a\s*>'
    )

    def envolver(m):

        bloque = m.group(0)

        texto = obtener_texto(campo)

        return reemplazar_unico(
            bloque,
            patron_texto(texto),
            lambda coincidencia:
                f'<span data-texto="{campo}">' +
                coincidencia.group(0) +
                '</span>',
            campo
        )

    contenido = reemplazar_unico(
        contenido,
        patron,
        envolver,
        campo
    )


# Incorporar el motor editorial.

anterior = (
    '<script defer src="assets/js/app.js"></script>'
)

nuevo = (
    anterior +
    '\n    <script defer src="assets/js/editorial.js"></script>'
)

if contenido.count(anterior) != 1:
    raise SystemExit(
        "No se encontro una referencia unica a app.js"
    )

contenido = contenido.replace(
    anterior,
    nuevo,
    1
)


# Validar todos los campos definidos en la configuracion.

def obtener_campos(objeto, prefijo=""):

    campos = []

    for clave, valor in objeto.items():

        nombre = (
            f"{prefijo}.{clave}"
            if prefijo else clave
        )

        if isinstance(valor, dict):

            campos.extend(
                obtener_campos(valor, nombre)
            )

        elif isinstance(valor, str):

            campos.append(nombre)

        else:

            raise SystemExit(
                f"Valor editorial invalido: {nombre}"
            )

    return campos


esperados = set(obtener_campos(textos))

vinculados = re.findall(
    r'data-texto="([^"]+)"',
    contenido
)

faltantes = esperados - set(vinculados)

sobrantes = set(vinculados) - esperados

if (
    faltantes or
    sobrantes or
    len(vinculados) != len(esperados)
):

    print("Campos faltantes:", sorted(faltantes))
    print("Campos sobrantes:", sorted(sobrantes))

    raise SystemExit(
        "La vinculacion editorial no es completa."
    )


# Guardar solamente despues de validar todo.

ruta.write_bytes(
    contenido.encode("utf-8")
)

print("Configuracion editorial incorporada.")
print(f"Campos definidos: {len(esperados)}")
print(f"Campos vinculados: {len(vinculados)}")
print("Campos faltantes: 0")
print("Campos sobrantes: 0")
