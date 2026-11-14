#!/usr/bin/env python3
"""Genera fichas.js (ficha técnica completa en español por versión) a partir de los datos
de Autohome (汽车之家) descargados desde el navegador.

Uso: python3 gen_fichas.py fichas_autohome.json imagenes_autohome.json catalogo.js salida/fichas.js
"""
import json, re, sys

# ---------------------------------------------------------------- secciones y etiquetas
SECCIONES = [
  ("Datos generales", [
    ("厂商", "Fabricante"), ("级别", "Segmento"), ("能源类型", "Tipo de energía"), ("车身结构", "Carrocería"),
    ("上市时间", "Lanzamiento (China)"), ("整车质保", "Garantía de fábrica (China)"),
  ]),
  ("Rendimiento", [
    ("CLTC纯电续航里程(km)", "Autonomía eléctrica CLTC"), ("WLTC纯电续航里程(km)", "Autonomía eléctrica WLTC"),
    ("CLTC综合续航(km)", "Autonomía combinada CLTC"), ("最大功率(kW)", "Potencia máxima"), ("电动机(Ps)", "Potencia eléctrica"),
    ("最大扭矩(N·m)", "Torque máximo"), ("官方0-100km/h加速(s)", "Aceleración 0–100 km/h"),
    ("官方0-50km/h加速(s)", "Aceleración 0–50 km/h"), ("最高车速(km/h)", "Velocidad máxima"),
    ("WLTC综合油耗(L/100km)", "Consumo combinado WLTC"), ("发动机", "Motor de combustión"),
    ("准拖挂车总质量(kg)", "Capacidad de remolque"),
  ]),
  ("Batería y carga", [
    ("电池类型", "Tipo de batería"), ("电池能量(kWh)", "Capacidad de batería"), ("电芯品牌", "Fabricante de celdas"),
    ("电池特有技术", "Tecnología de batería"), ("电池冷却方式", "Refrigeración de batería"),
    ("百公里耗电量(kWh/100km)", "Consumo eléctrico"), ("快充功率(kW)", "Potencia de carga rápida"),
    ("电池快充时间(分钟)", "Tiempo de carga rápida"), ("电池快充电量范围(%)", "Rango de carga rápida"),
    ("高压平台（V）", "Plataforma eléctrica"), ("对外交流放电功率(kW)", "Carga a otros equipos (V2L)"),
  ]),
  ("Motor y tracción", [
    ("电机类型", "Tipo de motor eléctrico"), ("驱动电机数", "Número de motores"), ("电机布局", "Ubicación del motor"),
    ("前电动机最大功率(kW)", "Motor delantero"), ("后电动机最大功率(kW)", "Motor trasero"),
    ("排量(L)", "Cilindrada"), ("进气形式", "Admisión"), ("最大马力(Ps)", "Potencia motor de combustión"),
    ("驱动方式", "Tracción"), ("四驱形式", "Tipo de 4×4"), ("三电系统质保", "Garantía batería y motor (China)"),
  ]),
  ("Dimensiones y pesos", [
    ("长*宽*高(mm)", "Largo × ancho × alto"), ("轴距(mm)", "Distancia entre ejes"),
    ("前轮距(mm)", "Trocha delantera"), ("后轮距(mm)", "Trocha trasera"), ("最小离地间隙(mm)", "Despeje del suelo"),
    ("接近角(°)", "Ángulo de ataque"), ("离去角(°)", "Ángulo de salida"), ("最小转弯半径(m)", "Radio de giro"),
    ("整备质量(kg)", "Peso en vacío"), ("最大满载质量(kg)", "Peso máximo cargado"), ("车门数(个)", "Puertas"),
    ("座位数(个)", "Asientos"), ("前备厢容积(L)", "Maletero delantero"), ("后备厢容积(L)", "Maletero trasero"),
    ("风阻系数(Cd)", "Coeficiente aerodinámico"), ("油箱容积(L)", "Tanque de combustible"),
  ]),
  ("Chasis, frenos y ruedas", [
    ("前悬架类型", "Suspensión delantera"), ("后悬架类型", "Suspensión trasera"), ("助力类型", "Dirección"),
    ("车体结构", "Estructura"), ("前制动器类型", "Frenos delanteros"), ("后制动器类型", "Frenos traseros"),
    ("驻车制动类型", "Freno de estacionamiento"), ("前轮胎规格", "Neumáticos delanteros"),
    ("后轮胎规格", "Neumáticos traseros"), ("备胎规格", "Rueda de auxilio"),
  ]),
  ("Seguridad", [
    ("主/副驾驶座安全气囊", "Airbags frontales"), ("前/后排侧气囊", "Airbags laterales"),
    ("前/后排头部气囊(气帘)", "Airbags de cortina"), ("前排中间气囊", "Airbag central delantero"),
    ("ABS防抱死", "Frenos ABS"), ("车身稳定控制(ESC/ESP/DSC等)", "Control de estabilidad (ESP)"),
    ("胎压监测功能", "Monitoreo de presión de neumáticos"), ("ISOFIX儿童座椅接口", "Anclajes ISOFIX"),
    ("主动刹车/主动安全系统", "Frenado autónomo de emergencia"), ("前方碰撞预警", "Alerta de colisión frontal"),
    ("后方碰撞预警", "Alerta de colisión trasera"), ("车道偏离预警系统", "Alerta de salida de carril"),
    ("DOW开门预警", "Alerta al abrir puertas"), ("疲劳驾驶提示", "Alerta de fatiga"),
    ("哨兵模式/千里眼", "Modo centinela"),
  ]),
  ("Asistencias de manejo", [
    ("辅助驾驶系统", "Sistema de asistencia"), ("辅助驾驶等级", "Nivel de asistencia"), ("激光雷达数量", "LiDAR"),
    ("巡航系统", "Control crucero"), ("车道居中保持", "Centrado de carril"), ("车道保持辅助系统", "Mantenimiento de carril"),
    ("并线辅助", "Alerta de punto ciego"), ("道路交通标识识别", "Reconocimiento de señales"),
    ("前/后驻车雷达", "Sensores de estacionamiento"), ("驾驶辅助影像", "Cámaras"),
    ("辅助泊车入位", "Estacionamiento asistido"), ("自动驻车", "Auto Hold"), ("上坡辅助", "Asistente de pendiente"),
    ("陡坡缓降", "Control de descenso"), ("驾驶模式切换", "Modos de manejo"), ("能量回收系统", "Freno regenerativo"),
  ]),
  ("Confort y tecnología", [
    ("中控屏幕尺寸", "Pantalla central"), ("液晶仪表尺寸", "Tablero digital"), ("HUD抬头数字显示", "Head-up display"),
    ("手机互联/映射", "Conexión con el celular"), ("语音识别控制系统", "Control por voz"), ("4G/5G网络", "Red móvil"),
    ("车联网", "Auto conectado (app)"), ("OTA升级", "Actualizaciones remotas (OTA)"),
    ("手机无线充电功能", "Carga inalámbrica del celular"), ("天窗类型", "Techo"), ("电动后备厢", "Portón trasero eléctrico"),
    ("感应后备厢", "Portón con sensor"), ("隐藏电动门把手", "Manijas ocultas"), ("无钥匙进入功能", "Acceso sin llave"),
    ("无钥匙启动系统", "Arranque sin llave"), ("车顶行李架", "Barras de techo"), ("近光灯光源", "Luces bajas"),
    ("远光灯光源", "Luces altas"), ("LED日间行车灯", "Luces diurnas LED"), ("自适应远近光", "Luces altas automáticas"),
    ("自动头灯", "Encendido automático de luces"), ("方向盘材质", "Volante"), ("方向盘加热", "Volante calefaccionado"),
    ("座椅材质", "Tapizado"), ("主座椅调节方式", "Ajustes asiento del conductor"), ("前排座椅功能", "Asientos delanteros"),
    ("电动座椅记忆功能", "Memoria de asientos"), ("后排座椅放倒形式", "Asientos traseros abatibles"),
    ("扬声器数量", "Parlantes"), ("主动式环境氛围灯", "Luz ambiental"), ("空调温度控制方式", "Aire acondicionado"),
    ("热泵空调", "Bomba de calor"), ("温度分区控制", "Climatizador por zonas"), ("车载冰箱", "Refrigerador"),
    ("车内PM2.5过滤装置", "Filtro de aire PM2.5"),
  ]),
]

# Algunas claves vienen repetidas con prefijo de grupo ("电池/充电/…"); se usan como respaldo.
ALIAS_PREFIJOS = ["", "电池/充电/", "车身/", "发动机/"]

UNIDADES = {
  "CLTC纯电续航里程(km)": " km", "WLTC纯电续航里程(km)": " km", "CLTC综合续航(km)": " km", "最大功率(kW)": " kW",
  "电动机(Ps)": " CV", "最大扭矩(N·m)": " N·m", "官方0-100km/h加速(s)": " s", "官方0-50km/h加速(s)": " s",
  "最高车速(km/h)": " km/h", "WLTC综合油耗(L/100km)": " L/100 km", "准拖挂车总质量(kg)": " kg",
  "电池能量(kWh)": " kWh", "百公里耗电量(kWh/100km)": " kWh/100 km", "快充功率(kW)": " kW", "电池快充时间(分钟)": " min",
  "电池快充电量范围(%)": " %", "高压平台（V）": " V", "对外交流放电功率(kW)": " kW", "前电动机最大功率(kW)": " kW",
  "后电动机最大功率(kW)": " kW", "排量(L)": " L", "最大马力(Ps)": " CV", "长*宽*高(mm)": " mm", "轴距(mm)": " mm",
  "前轮距(mm)": " mm", "后轮距(mm)": " mm", "最小离地间隙(mm)": " mm", "接近角(°)": "°", "离去角(°)": "°",
  "最小转弯半径(m)": " m", "整备质量(kg)": " kg", "最大满载质量(kg)": " kg", "前备厢容积(L)": " L", "后备厢容积(L)": " L",
  "油箱容积(L)": " L",
}

VALORES = {
  "●": "Sí", "○": "Opcional", "纯电动": "100% eléctrico", "插电式混合动力": "Híbrido enchufable (PHEV)", "增程式": "Eléctrico de autonomía extendida",
  "紧凑型SUV": "SUV compacto", "中型SUV": "SUV mediano", "中大型SUV": "SUV mediano-grande", "小型SUV": "SUV pequeño",
  "小型车": "Auto pequeño", "紧凑型车": "Auto compacto", "SUV": "SUV", "两厢车": "Hatchback",
  "5门5座SUV": "SUV 5 puertas, 5 asientos", "5门4座两厢车": "Hatchback 5 puertas, 4 asientos", "5门5座两厢车": "Hatchback 5 puertas, 5 asientos",
  "永磁/同步": "Imanes permanentes / síncrono", "单电机": "Un motor", "双电机": "Dos motores", "前置": "Delantero", "后置": "Trasero",
  "前置+后置": "Delantero + trasero", "磷酸铁锂电池": "Litio ferrofosfato (LFP)", "宁德时代": "CATL", "中创新航": "CALB",
  "弗迪": "FinDreams (BYD)", "因湃电池": "Inpai (GAC)", "孚能科技": "Farasis", "欣旺达": "Sunwoda", "江苏正力": "Zenergy",
  "金钟罩电池": "Batería 'Golden Bell'", "刀片电池": "Blade (BYD)", "弹匣电池": "Magazine (GAC)", "液冷": "Líquida", "直冷": "Refrigerante directo",
  "后置后驱": "Trasera (RWD)", "前置前驱": "Delantera (FWD)", "前置四驱": "4×4 (AWD)", "电动四驱": "4×4 eléctrico",
  "双电机四驱": "4×4 de dos motores",
  "麦弗逊式独立悬架": "Independiente McPherson", "五连杆式独立悬架": "Independiente de cinco brazos",
  "多连杆式独立悬架": "Independiente multibrazo", "扭力梁式非独立悬架": "Eje de torsión", "双叉臂式独立悬架": "Independiente de doble horquilla",
  "双球节麦弗逊式悬架": "McPherson de doble rótula", "H臂多连杆式独立悬架": "Independiente multibrazo (brazo en H)",
  "电动助力": "Asistida eléctrica", "承载式": "Monocasco", "非承载式": "Chasis de largueros", "通风盘式": "Discos ventilados", "盘式": "Discos",
  "电子驻车": "Electrónico", "无": "No incluye", "补胎工具": "Kit de reparación", "胎压显示": "Sí, con lectura de presión",
  "胎压报警": "Sí, con alerta", "运动": "Sport", "经济": "Eco", "标准/舒适": "Normal/Confort", "自定义/个性化": "Personalizado",
  "雪地": "Nieve", "越野": "Todoterreno", "360度全景影像": "Cámara 360°", "车侧盲区影像": "Cámara de punto ciego",
  "全速自适应巡航": "Adaptativo de velocidad completa", "定速巡航": "Velocidad fija", "L2": "Nivel 2",
  "LED": "LED", "不可开启全景天窗": "Panorámico fijo", "可开启全景天窗": "Panorámico corredizo", "全车": "Todas las puertas",
  "驾驶位": "Conductor", "副驾驶位": "Acompañante", "前排": "Delanteros", "后排": "Traseros", "多媒体系统": "Multimedia",
  "导航": "Navegación", "电话": "Teléfono", "空调": "Aire acondicionado", "车窗": "Ventanas", "座椅加热": "Calefacción de asientos",
  "座椅通风": "Ventilación de asientos", "座椅按摩": "Masaje", "4G": "4G", "5G": "5G", "皮质": "Cuero", "真皮": "Cuero genuino",
  "仿皮": "Símil cuero", "塑料": "Plástico", "皮/翻毛材质混搭": "Cuero / gamuza", "前后调节": "adelante/atrás",
  "靠背调节": "respaldo", "高低调节(2向)": "altura", "高低调节(4向)": "altura (4 vías)", "腰部支撑(4向)": "soporte lumbar",
  "腿托调节": "apoyapiernas", "侧翼支撑(主动)": "soporte lateral activo", "加热": "calefacción", "通风": "ventilación",
  "按摩": "masaje", "按摩(仅驾驶位)": "masaje (conductor)", "按摩(仅副驾驶位)": "masaje (acompañante)",
  "加热(仅驾驶位)": "calefacción (conductor)", "头枕扬声器": "parlantes en apoyacabezas",
  "头枕扬声器(仅驾驶位)": "parlantes en apoyacabezas (conductor)", "比例放倒": "Abatibles por partes",
  "整体放倒": "Abatible completo", "自动空调": "Automático", "支持CarPlay": "Apple CarPlay", "支持HUAWEI HiCar": "Huawei HiCar",
  "支持Carlink": "CarLink", "荣耀车联": "Honor", "涡轮增压": "Turbo",
}

COMPANIAS = {"深蓝汽车": "Deepal (Changan)", "比亚迪": "BYD", "长安启源": "Changan Qiyuan", "埃安": "GAC AION",
             "长安马自达": "Changan Mazda", "东风日产": "Dongfeng Nissan", "广汽丰田": "GAC Toyota", "方程豹": "Fangchengbao (BYD)"}

SISTEMAS = {"天枢领航视觉版": "Tianshu (navegación asistida, cámaras)", "华为乾崑智驾ADS 4 Pro": "Huawei Qiankun ADS 4 Pro",
            "广汽GSD": "GAC GSD", "DiPilot 100": "BYD DiPilot 100", "DiPilot 300": "BYD DiPilot 300",
            "E-ZERO无界智能领航": "Mazda E-ZERO", "东风日产组合驾驶辅助系统": "Nissan ProPilot (Dongfeng)",
            "Toyota Pilot": "Toyota Pilot", "Momenta": "Momenta", "Momenta 6.0": "Momenta 6.0"}


def miles(n):
    return f"{n:,}".replace(",", ".")


def trad_token(t):
    t = t.strip()
    opcional = False
    if t.endswith("(选配)"):
        opcional, t = True, t[:-4]
    if t in VALORES: r = VALORES[t]
    elif t in COMPANIAS: r = COMPANIAS[t]
    elif t in SISTEMAS: r = SISTEMAS[t]
    elif re.fullmatch(r"[\d.]+英寸", t): r = t.replace("英寸", '"').replace(".", ",")
    elif re.fullmatch(r"\d+喇叭", t): r = t.replace("喇叭", " parlantes")
    elif re.fullmatch(r"\d+个", t): r = t.replace("个", " sensor(es)")
    else:
        m = re.fullmatch(r"(.+?)年或([\d.]+)万公里", t)
        nums = {"三": 3, "四": 4, "五": 5, "六": 6, "八": 8, "十": 10}
        if m:
            y = nums.get(m.group(1), m.group(1))
            km = int(float(m.group(2)) * 10000)
            r = f"{y} años o {miles(km)} km"
        elif re.fullmatch(r"[\d./ R\-*A-Za-z]+", t):
            r = t
        else:
            r = re.sub(r"(\d)马力", r"\1 CV", t).replace("L4", "4 cilindros")
            if re.search(r"[一-鿿]", r):
                return None  # sin traducción: se omite
    return r + (" (opcional)" if opcional else "")


def trad_marcas(v):
    # "主●/副●", "前●/后-", "前-/后●"
    lado = {"主": "Conductor", "副": "Acompañante", "前": "Delanteros", "后": "Traseros"}
    partes = []
    for p in v.split("/"):
        m = re.fullmatch(r"([主副前后])([●○\-])", p.strip())
        if not m: return None
        s = {"●": "sí", "○": "opcional", "-": "no"}[m.group(2)]
        partes.append(f"{lado[m.group(1)]}: {s}")
    return " · ".join(partes)


def trad_valor(clave, v):
    v = str(v).strip()
    if re.fullmatch(r"([主副前后][●○\-]/?)+", v.replace("/", "/")) and ("●" in v or "-" in v or "○" in v) and len(v) <= 9:
        return trad_marcas(v)
    if clave == "长*宽*高(mm)":
        return " × ".join(miles(int(x)) if x.isdigit() else x for x in v.split("*")) + " mm"
    if clave == "电池能量(kWh)":
        v = v.split("/")[0]
    if clave == "上市时间":
        m = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", v)
        return f"{m.group(3)}/{m.group(2)}/{m.group(1)}" if m else v
    if re.fullmatch(r"[\d.]+(-[\d.]+)?", v):
        def f(n):
            return miles(int(n)) if re.fullmatch(r"\d{4,}", n) else n.replace(".", ",")
        if clave == "电池快充电量范围(%)":
            return v.replace("-", "–") + " %"
        return "–".join(f(n) for n in v.split("-")) + UNIDADES.get(clave, "")
    tokens = [trad_token(t) for t in v.split("、")]
    tokens = [t for t in tokens if t]
    if not tokens: return None
    s = ", ".join(tokens)
    if clave in ("主座椅调节方式", "前排座椅功能"):
        s = s[0].upper() + s[1:]
    return s


def ficha_es(raw):
    secciones = []
    for titulo, campos in SECCIONES:
        filas = []
        for clave, etiqueta in campos:
            val = None
            for pre in ALIAS_PREFIJOS:
                if pre + clave in raw:
                    val = raw[pre + clave]; break
            if val is None: continue
            t = trad_valor(clave, val)
            if t: filas.append([etiqueta, t])
        if filas: secciones.append([titulo, filas])
    return secciones


def img_url(path, size="800x600_0_q95_c42_"):
    host, rest = path.split("/", 1)
    d, f = rest.rsplit("/", 1)
    return f"https://{host}.autoimg.cn/{d}/{size}{f}"


def main(raw_path, img_path, catalogo_path, out_path):
    raw = json.load(open(raw_path, encoding="utf-8"))
    imgs = json.load(open(img_path, encoding="utf-8"))
    t = open(catalogo_path, encoding="utf-8").read()
    cat = json.loads(t[t.index("{"):t.rindex("}") + 1])
    by_id = {str(m["id"]): m for m in cat["modelos"]}
    out, faltan = {}, []
    for mid, r in raw.items():
        m = by_id.get(mid)
        if not m: faltan.append(mid); continue
        key = "|".join(str(m.get(k) or "") for k in ("marca", "modelo", "version", "anio"))
        g = imgs.get(m["marca"] + "|" + m["modelo"], {})
        galeria = [img_url(p) for p in (g.get("ext", [])[:4] + g.get("ctl", [])[:1] + g.get("seat", [])[:1])]
        secc = ficha_es(r)
        out[key] = {"version_china": r.get("_name"), "autohome_spec": r.get("_spec"), "secciones": secc, "galeria": galeria}
        sin = sum(len(s[1]) for s in secc)
        print(f"{mid:>3} {m['marca']} {m['modelo']} {m['version']}: {sin} datos, {len(galeria)} fotos  ← {r.get('_name')}")
    js = ("// Fichas técnicas completas (fuente: Autohome / 汽车之家, traducidas al español). Clave: Marca|Modelo|Versión|Año del Excel.\n"
          "window.VASCRUZ_FICHAS = " + json.dumps(out, ensure_ascii=False, indent=0) + ";\n")
    open(out_path, "w", encoding="utf-8").write(js)
    if faltan: print("Sin modelo en catálogo:", faltan)


if __name__ == "__main__":
    main(*sys.argv[1:5])
