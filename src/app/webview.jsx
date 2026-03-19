import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    FlatList,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';

const SWAD_HOME = 'https://swad.ugr.es/';

// ─────────────────────────────────────────────────────────────────────────────
// INJECT: CSS agresivo + ocultar cabecera + ocultar navs de SWAD
// ─────────────────────────────────────────────────────────────────────────────
const INJECTED_CSS_JS = `
(function() {
  if (!document.querySelector('meta[name="viewport"]')) {
    var mv = document.createElement('meta');
    mv.name = 'viewport';
    mv.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0';
    document.head.appendChild(mv);
  }
  if (document.getElementById('__swad_fix__')) return;

  var s = document.createElement('style');
  s.id = '__swad_fix__';
  s.textContent = \`
    /* ── Base ── */
    * { box-sizing: border-box; }
    body {
      -webkit-text-size-adjust: 100%;
      font-size: 15px !important;
      line-height: 1.5 !important;
    }
    img { max-width: 100% !important; height: auto !important; }
    table { max-width: 100% !important; word-break: break-word; }
    pre, code { white-space: pre-wrap !important; word-break: break-all !important; }

    /* ── Tipografía global más legible ── */
    p, li, td, th, div, span, a {
      font-size: 14px !important;
      line-height: 1.55 !important;
    }
    h1, h2, h3, .TITLE_BOX, .TITLE {
      font-size: 17px !important;
      font-weight: 700 !important;
      line-height: 1.3 !important;
    }
    h4, h5, .SUBTITLE { font-size: 15px !important; }
    input, textarea, select, button {
      font-size: 14px !important;
    }
    /* Posts/mensajes más legibles */
    .MSG_TXT, .MSG, .CONTENT_AREA {
      font-size: 15px !important;
      line-height: 1.6 !important;
    }

    /* ── OCULTAR: cabecera institucional (logo + nombre usuario) ── */
    #HEAD, #head, div#HEAD, table#HEAD, .HEAD,
    div.HEAD_ROW, tr.HEAD_ROW,
    #main_top, #top_header, div#top,
    #MAIN_BREADCRUMB, .MAIN_BREADCRUMB,
    #breadcrumb, .breadcrumb_container,
    #page_top, #top_bar { display: none !important; }

    /* ── OCULTAR: menú superior de pestañas (STAFF/COUR/ASSI/FILES/USER…) ── */
    #nav_MAIN_MENU,
    #main_menu,
    div#main_menu,
    table#main_menu,
    .MAIN_MENU,
    .ICON_MENU,
    #tabs_left,
    .MENU_OPTION_BOX,
    ul.MENU_LIST,
    #MENU_LIST,
    #mnu,
    .mnu { display: none !important; }

    /* ── OCULTAR: barra de sub-tabs (Sea/Tim/Pro/Cal/Not) ── */
    #sub_menu,
    #SUB_MENU,
    .SUB_MENU,
    .TABS_ACTIVE_BIG,
    .TABS_ACTIVE,
    #tabs_container,
    .tab_container,
    #TABS,
    .TABS { display: none !important; }

    /* ── OCULTAR: breadcrumb textual System > Spain > ugr.es ── */
    .BREADCRUMB, #BREADCRUMB,
    div[id*="breadcrumb"],
    div[class*="breadcrumb"] { display: none !important; }

    /* ── Compensar espacios vacíos ── */
    body { padding-top: 0 !important; margin-top: 0 !important; }
    #page_content, #main_content, .CONTENT_AREA {
      margin-top: 2px !important;
      padding-top: 4px !important;
    }

    /* ── Mejorar cards/cajas de contenido ── */
    .FRAME_LIST_COL1, .FRAME_LIST_COL2, .FRAME_LIST_COL3 {
      border-radius: 8px !important;
      overflow: hidden !important;
    }
    .TITLE_BOX {
      padding: 8px 12px !important;
    }
  \`;
  document.head.appendChild(s);
})(); true;
`;

// ─────────────────────────────────────────────────────────────────────────────
// INJECT: segunda pasada DOM para ocultar lo que no cogió el CSS
// ─────────────────────────────────────────────────────────────────────────────
const HIDE_DOM_JS = `
(function() {
  function hide(el) { if (el) el.style.setProperty('display','none','important'); }

  // Cabecera: IDs directos
  ['HEAD','head','main_top','top_header','top_bar','page_top',
   'breadcrumb','MAIN_BREADCRUMB','mnu','main_menu','sub_menu',
   'TABS','tabs_container','nav_MAIN_MENU'].forEach(function(id) {
    hide(document.getElementById(id));
  });

  // Foto del usuario → ocultar fila contenedora
  document.querySelectorAll('img.PHOTO_USR, img.PHOTO_USER').forEach(function(img) {
    var el = img;
    for (var i = 0; i < 5; i++) {
      el = el && el.parentElement;
      if (!el) break;
      if (el.tagName === 'TR' || el.tagName === 'HEADER' ||
          (el.tagName === 'DIV' && el.offsetHeight < 80)) {
        hide(el); break;
      }
    }
  });

  // "Student:" / "Estudiante:" → ocultar fila
  document.querySelectorAll('td,div,span').forEach(function(el) {
    if (/^(Student|Teacher|Estudiante|Profesor):/.test((el.textContent||'').trim())) {
      var row = el;
      for (var i = 0; i < 4; i++) {
        row = row && row.parentElement;
        if (!row) break;
        if (row.tagName === 'TR' || row.tagName === 'HEADER') { hide(row); break; }
      }
    }
  });

  // Breadcrumb textual
  document.querySelectorAll('div,td,p').forEach(function(el) {
    if (/System\s*>/.test(el.textContent||'') && el.children.length < 8) hide(el);
  });

  // Menú de iconos: buscar tablas/divs con muchos LI de menú
  document.querySelectorAll('ul,ol,div').forEach(function(el) {
    var links = el.querySelectorAll('a');
    if (links.length >= 6 && links.length <= 12 && el.offsetHeight < 120) {
      // Comprobar que sea un menú (todos los links son cortos)
      var allShort = Array.from(links).every(function(a) {
        return (a.textContent||'').trim().length < 12;
      });
      if (allShort) hide(el);
    }
  });
})(); true;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Rutas rápidas de SWAD (act=XXX)
// ─────────────────────────────────────────────────────────────────────────────
const NAV = {
  home:      `window.location.href='${SWAD_HOME}'; true;`,
  timeline:  `window.location.href='${SWAD_HOME}?act=Tmt'; true;`,
  forum:     `(function(){ var l=Array.from(document.querySelectorAll('a[href]')).find(function(a){return /[?&]act=For/i.test(a.href);}); if(l)l.click(); else window.location.href='${SWAD_HOME}?act=ForCourse'; })(); true;`,
  files:     `window.location.href='${SWAD_HOME}?act=SeeAdmDocCrsGrp'; true;`,
  calendar:  `window.location.href='${SWAD_HOME}?act=SeeCal'; true;`,
  notif:     `window.location.href='${SWAD_HOME}?act=SeeNtf'; true;`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────
const CHECK_LOGIN_FORM_JS = `
(function(){
  var h=!!(document.querySelector('input[name="UsrId"]')||document.querySelector('input[name="Passwd"]'));
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'LOGIN_FORM_CHECK',hasForm:h}));
})(); true;`;

const buildAutoLoginJS = (u, p) => `
(function(){
  var u=document.querySelector('input[name="UsrId"]')||document.querySelector('input[type="text"]');
  var p=document.querySelector('input[name="Passwd"]')||document.querySelector('input[type="password"]');
  if(u&&p){
    var s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    s.call(u,${JSON.stringify(u)});u.dispatchEvent(new Event('input',{bubbles:true}));
    s.call(p,${JSON.stringify(p)});p.dispatchEvent(new Event('input',{bubbles:true}));
    var b=document.querySelector('button[type="submit"]')||document.querySelector('input[type="submit"]')||document.querySelector('button.BT_CONFIRM')||document.querySelector('button.bt');
    if(b){b.click();}else{var f=u.closest('form');if(f)f.submit();}
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'AUTO_LOGIN_FIRED'}));
  }else{window.ReactNativeWebView.postMessage(JSON.stringify({type:'FORM_NOT_FOUND'}));}
})(); true;`;

// ─────────────────────────────────────────────────────────────────────────────
// Cursos
// ─────────────────────────────────────────────────────────────────────────────
const SCRAPE_COURSES_JS = `
(function(){
  var sel=document.querySelector('select[name="crs"]')||document.querySelector('select[id*="crs"]')||document.querySelector('select[name="course"]');
  if(!sel){window.ReactNativeWebView.postMessage(JSON.stringify({type:'COURSES_NOT_FOUND'}));return;}
  sel.style.display='none';
  var p=sel.parentElement;
  if(p&&p.tagName!=='BODY'&&p.tagName!=='FORM')p.style.display='none';
  var opts=Array.from(sel.options).map(function(o){return{value:o.value,label:o.text.trim(),selected:o.selected};});
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'COURSES_FOUND',courses:opts,current:sel.value}));
})(); true;`;

const buildChangeCourseJS = (v) => `
(function(){
  var sel=document.querySelector('select[name="crs"]')||document.querySelector('select[id*="crs"]')||document.querySelector('select[name="course"]');
  if(!sel)return;
  sel.value=${JSON.stringify(v)};
  sel.dispatchEvent(new Event('change',{bubbles:true}));
  var f=sel.closest('form');
  if(f)setTimeout(function(){f.submit();},50);
})(); true;`;

// ─────────────────────────────────────────────────────────────────────────────
// Tabs de la bottom bar
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'home',     icon: '⌂', label: 'Inicio'   },
  { key: 'timeline', icon: '◷', label: 'Timeline' },
  { key: 'forum',    icon: '✉', label: 'Foros'    },
  { key: 'files',    icon: '▤', label: 'Archivos' },
  { key: 'calendar', icon: '▦', label: 'Agenda'   },
  { key: 'notif',    icon: '◎', label: 'Notif'    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Modal selector de cursos
// ─────────────────────────────────────────────────────────────────────────────
function CourseModal({ visible, courses, currentValue, onSelect, onClose }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose} />
      <View style={[m.sheet, { paddingBottom: insets.bottom + 8 }]}>
        <View style={m.handle} />
        <Text style={m.title}>Cambiar asignatura</Text>
        <FlatList
          data={courses}
          keyExtractor={(item) => String(item.value)}
          renderItem={({ item }) => {
            const active = item.value === currentValue;
            return (
              <Pressable
                style={[m.option, active && m.optionActive]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={[m.optionText, active && m.optionTextActive]} numberOfLines={2}>
                  {item.label}
                </Text>
                {active && <Text style={m.check}>✓</Text>}
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={m.sep} />}
          style={{ paddingHorizontal: 12 }}
        />
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pantalla principal
// ─────────────────────────────────────────────────────────────────────────────
export default function WebViewScreen() {
  const insets              = useSafeAreaInsets();
  const { session, logout } = useAuth();
  const webRef              = useRef(null);

  const [loading,       setLoading]       = useState(true);
  const [canGoBack,     setCanGoBack]     = useState(false);
  const [loggedIn,      setLoggedIn]      = useState(false);
  const [courses,       setCourses]       = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [showCourses,   setShowCourses]   = useState(false);
  const [activeTab,     setActiveTab]     = useState('home');
  const loginFiredRef                     = useRef(false);

  // Back Android
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack && webRef.current) { webRef.current.goBack(); return true; }
        return false;
      });
      return () => sub.remove();
    }, [canGoBack])
  );

  const handleNavChange = (ns) => {
    if (!ns) return;
    setCanGoBack(ns.canGoBack ?? false);
  };

  const handleLoadEnd = ({ nativeEvent }) => {
    if (!nativeEvent) return;
    setLoading(false);
    webRef.current?.injectJavaScript(INJECTED_CSS_JS);
    // Segunda pasada DOM con pequeño delay para dar tiempo a renderizar
    setTimeout(() => {
      webRef.current?.injectJavaScript(HIDE_DOM_JS);
      webRef.current?.injectJavaScript(CHECK_LOGIN_FORM_JS);
      webRef.current?.injectJavaScript(SCRAPE_COURSES_JS);
    }, 300);
  };

  const handleMessage = ({ nativeEvent }) => {
    try {
      const msg = JSON.parse(nativeEvent.data);
      switch (msg.type) {
        case 'LOGIN_FORM_CHECK':
          if (msg.hasForm) {
            setLoggedIn(false); setCourses([]); setCurrentCourse(null);
            if (!loginFiredRef.current && session) {
              loginFiredRef.current = true;
              webRef.current?.injectJavaScript(buildAutoLoginJS(session.userId, session.password));
            }
          } else {
            setLoggedIn(true);
          }
          break;
        case 'COURSES_FOUND':
          setCourses(msg.courses || []);
          const found = (msg.courses || []).find(c => c.value === msg.current) || msg.courses?.[0];
          if (found) setCurrentCourse(found);
          break;
        case 'FORM_NOT_FOUND':
          Alert.alert('Login manual', 'Inicia sesión en la página.', [{ text: 'OK' }]);
          break;
      }
    } catch {}
  };

  const handleTab = (tab) => {
    setActiveTab(tab.key);
    webRef.current?.injectJavaScript(NAV[tab.key]);
  };

  const confirmLogout = () =>
    Alert.alert('Cerrar sesión', '¿Salir de SWAD?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: () => {
          loginFiredRef.current = false;
          setLoggedIn(false); setCourses([]); setCurrentCourse(null);
          logout();
        },
      },
    ]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* ══════════ TOP BAR ════════════════════════════════════════════ */}
      <View style={s.topBar}>
        <Pressable
          style={({ pressed }) => [s.navBtn, !canGoBack && s.navBtnOff, pressed && s.pressed]}
          onPress={() => webRef.current?.goBack()}
          disabled={!canGoBack} hitSlop={10}
        >
          <Text style={s.navArrow}>‹</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [s.navBtn, pressed && s.pressed]}
          onPress={() => webRef.current?.goForward()} hitSlop={10}
        >
          <Text style={s.navArrow}>›</Text>
        </Pressable>

        {/* Selector de asignatura en el centro del top bar */}
        {loggedIn && courses.length > 0 ? (
          <Pressable
            style={({ pressed }) => [s.courseChip, pressed && { opacity: 0.7 }]}
            onPress={() => setShowCourses(true)}
          >
            <Text style={s.courseChipText} numberOfLines={1}>
              {currentCourse?.label ?? 'Asignatura'}
            </Text>
            <Text style={s.courseChipChevron}>⌄</Text>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <Pressable
          style={({ pressed }) => [s.logoutBtn, pressed && s.pressed]}
          onPress={confirmLogout} hitSlop={10}
        >
          <Text style={s.logoutText}>Salir</Text>
        </Pressable>
      </View>

      {/* ══════════ LOADING ════════════════════════════════════════════ */}
      {loading && (
        <View style={s.loadingBar}>
          <ActivityIndicator size="small" color={UGR} />
          <Text style={s.loadingText}>Cargando…</Text>
        </View>
      )}

      {/* ══════════ WEBVIEW ════════════════════════════════════════════ */}
      <WebView
        ref={webRef}
        source={{ uri: SWAD_HOME }}
        style={s.webview}
        onLoadEnd={handleLoadEnd}
        onLoadStart={() => setLoading(true)}
        onNavigationStateChange={handleNavChange}
        onMessage={handleMessage}
        onError={({ nativeEvent }) => {
          setLoading(false);
          Alert.alert('Error', nativeEvent?.description || 'Sin conexión.');
        }}
        mixedContentMode="always"
        javaScriptEnabled domStorageEnabled
        sharedCookiesEnabled thirdPartyCookiesEnabled
        scalesPageToFit={Platform.OS === 'android'}
        allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
        userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      />

      {/* ══════════ BOTTOM TAB BAR (solo con sesión activa) ════════════ */}
      {loggedIn && (
        <View style={[s.tabBar, { paddingBottom: insets.bottom || 6 }]}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={({ pressed }) => [s.tabBtn, pressed && s.tabPressed]}
                onPress={() => handleTab(tab)}
              >
                <View style={[s.tabIconWrap, active && s.tabIconWrapActive]}>
                  <Text style={[s.tabIcon, active && s.tabIconActive]}>{tab.icon}</Text>
                </View>
                <Text style={[s.tabLabel, active && s.tabLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ══════════ MODAL CURSOS ═══════════════════════════════════════ */}
      <CourseModal
        visible={showCourses}
        courses={courses}
        currentValue={currentCourse?.value}
        onSelect={(c) => { setCurrentCourse(c); webRef.current?.injectJavaScript(buildChangeCourseJS(c.value)); }}
        onClose={() => setShowCourses(false)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const UGR      = '#c1002b';
const UGR_DARK = '#9b0022';
const UGR_TAB  = '#830019';

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: UGR },

  /* ── Top bar ── */
  topBar: {
    backgroundColor: UGR,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 6,
    gap: 4,
  },
  navBtn: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  navBtnOff: { opacity: 0.28 },
  pressed: { opacity: 0.5 },
  navArrow: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30, includeFontPadding: false },

  /* Chip de asignatura en el top */
  courseChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 4,
    gap: 4,
  },
  courseChipText: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 13 },
  courseChipChevron: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 16 },

  logoutBtn: {
    height: 30, paddingHorizontal: 11, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
  },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 12 },

  /* Loading */
  loadingBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff0f3', paddingVertical: 4, gap: 6,
  },
  loadingText: { color: UGR, fontSize: 11, fontWeight: '500' },

  /* WebView */
  webview: { flex: 1, backgroundColor: '#fff' },

  /* ── Bottom tab bar ── */
  tabBar: {
    backgroundColor: UGR_DARK,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  tabPressed: { opacity: 0.6 },
  tabIconWrap: {
    width: 32, height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  tabIcon: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
    includeFontPadding: false,
  },
  tabIconActive: { color: '#fff' },
  tabLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: { color: '#fff', fontWeight: '700' },
});

// ── Modal styles ──────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    maxHeight: '75%', paddingTop: 12,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0', alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 8, paddingHorizontal: 16 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, borderRadius: 10 },
  optionActive: { backgroundColor: '#fff0f3' },
  optionText: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  optionTextActive: { color: UGR, fontWeight: '700' },
  check: { fontSize: 16, color: UGR, fontWeight: '700', marginLeft: 8 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#ececec', marginHorizontal: 12 },
});