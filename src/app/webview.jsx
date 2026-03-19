import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  StyleSheet,
  Modal,
  FlatList,
  ScrollView,
  Image,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const SWAD_HOME = "https://swad.ugr.es/";

// ─────────────────────────────────────────────────────────────────────────────
// Tabs Inferiores — Navegación (act = 2, NxtTab = X)
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  {
    key: "sta",
    iconOff: "home-outline",
    iconOn: "home",
    act: "2",
    nxtTab: "1",
  },
  {
    key: "cou",
    iconOff: "school-outline",
    iconOn: "school",
    act: "2",
    nxtTab: "7",
  },
  {
    key: "ass",
    iconOff: "checkbox-outline",
    iconOn: "checkbox",
    act: "2",
    nxtTab: "8",
  },
  {
    key: "file",
    iconOff: "folder-outline",
    iconOn: "folder",
    act: "2",
    nxtTab: "9",
  },
  {
    key: "use",
    iconOff: "people-outline",
    iconOn: "people",
    act: "2",
    nxtTab: "10",
  },
  {
    key: "com",
    iconOff: "chatbubbles-outline",
    iconOn: "chatbubbles",
    act: "2",
    nxtTab: "11",
  },
  {
    key: "ana",
    iconOff: "bar-chart-outline",
    iconOn: "bar-chart",
    act: "2",
    nxtTab: "12",
  },
  {
    key: "pro",
    iconOff: "person-outline",
    iconOn: "person",
    act: "2",
    nxtTab: "13",
  },
];

const getIonicon = (swadIcon) => {
  const map = {
    search: "search-outline",
    "comment-dots": "chatbox-ellipses-outline",
    "circle-user": "people-circle-outline",
    calendar: "calendar-outline",
    bell: "notifications-outline",
    info: "information-circle-outline",
    "clipboard-list": "clipboard-outline",
    "book-open": "book-outline",
    "list-ol": "list-outline",
    book: "book",
    question: "help-circle-outline",
    "up-right-from-square": "open-outline",
    edit: "pencil-outline",
    "file-invoice": "document-text-outline",
    bullhorn: "megaphone-outline",
    check: "checkmark-circle-outline",
    "file-signature": "create-outline",
    gamepad: "game-controller-outline",
    "folder-open": "folder-open-outline",
    "list-alt": "list-circle-outline",
    briefcase: "briefcase-outline",
    sitemap: "git-network-outline",
    users: "people-outline",
    "person-chalkboard": "person-outline",
    "user-group": "people-circle-outline",
    "calendar-check": "calendar-clear-outline",
    "user-clock": "time-outline",
    "sticky-note": "document-outline",
    comments: "chatbubbles-outline",
    envelope: "mail-outline",
    "chart-pie": "pie-chart-outline",
    "graduation-cap": "school-outline",
    tasks: "stats-chart-outline",
    poll: "podium-outline",
    "chart-line": "trending-up-outline",
    "file-alt": "document-text-outline",
    heart: "heart-outline",
    "power-off": "power-outline",
    clock: "time-outline",
    at: "at-outline",
    cog: "settings-outline",
  };
  return map[swadIcon] || "ellipse-outline";
};

// ─────────────────────────────────────────────────────────────────────────────
// CSS inyectado (Limpieza)
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
    * { box-sizing: border-box; }
    body { -webkit-text-size-adjust:100%; font-size:15px !important; line-height:1.5 !important;
           padding-top:0 !important; margin-top:0 !important; }
    img  { max-width:100% !important; height:auto !important; }
    table{ max-width:100% !important; word-break:break-word; }
    pre,code{ white-space:pre-wrap !important; word-break:break-all !important; }
    p,li,td,th,div,span,a { font-size:14px !important; line-height:1.55 !important; }
    
    header, #head_row_1, #head_row_2, #main_title, #msg,
    .HEAD_ROW_3_DARK, #tabs, .MENU_LIST_CONT, ul.MENU_LIST,
    footer, #foot_zone, address.ABOUT
    { display: none !important; }

    #main_zone, #main_zone_central_container, .MAIN_ZONE_CANVAS
    { margin-top: 0 !important; padding-top: 4px !important; border: none !important; background: transparent !important; box-shadow: none !important; }

    .FRAME, .FRAME_DARK { background-color: transparent !important; border: none !important; box-shadow: none !important; }
  \`;
  document.head.appendChild(s);
})(); true;
`;

const HIDE_DOM_JS = `
(function() {
  try {
    function hide(el){ if(el) el.style.setProperty('display','none','important'); }
    document.querySelectorAll('header, .HEAD_ROW_3_DARK, .MENU_LIST_CONT, footer').forEach(hide);
  } catch (e) {}
})(); true;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Autologin JS
// ─────────────────────────────────────────────────────────────────────────────
const buildAutoLoginJS = (userId, password) => `
(function(){
  try {
    var u = document.getElementById('UsrId') || document.querySelector('input[name="UsrId"]');
    var p = document.getElementById('UsrPwd') || document.querySelector('input[name="UsrPwd"]');
    
    if(u && p){
      var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      
      setter.call(u, ${JSON.stringify(userId)});
      u.dispatchEvent(new Event('input', { bubbles: true }));
      
      setter.call(p, ${JSON.stringify(password)});
      p.dispatchEvent(new Event('input', { bubbles: true }));
      
      var btn = document.querySelector('button.BT_CONFIRM') || document.querySelector('button[type="submit"]');
      if(btn) {
        btn.click();
      } else {
        var f = u.closest('form');
        if(f) f.submit();
      }
    }
  } catch(e) {}
})(); true;`;

// ─────────────────────────────────────────────────────────────────────────────
// Scrapeador de estado
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_STATE_JS = `
(function(){
  try {
    var isDark = document.body.classList.contains('BODY_DARK');
    var hasForm = !!(document.querySelector('input[name="UsrId"]') || document.querySelector('input[name="UsrPwd"]'));
    
    var userName = '';
    var userPhoto = '';
    var usrEl = document.querySelector('.HEAD_USR');
    if(usrEl) {
      var txt = usrEl.textContent || '';
      var split = txt.split(':');
      userName = split.length > 1 ? split[1].trim() : txt.trim();
      var imgEl = usrEl.querySelector('img');
      if(imgEl) userPhoto = imgEl.src;
    }

    // 🔴 NUEVO: Extraemos en qué pestaña nativa de SWAD estamos realmente
    var currentTabKey = null;
    var activeTabEl = document.querySelector('.TAB_ON input[name="NxtTab"]');
    if (activeTabEl) {
      var val = activeTabEl.value;
      var map = {"1":"sta", "7":"cou", "8":"ass", "9":"file", "10":"use", "11":"com", "12":"ana", "13":"pro"};
      if(map[val]) currentTabKey = map[val];
    }

    var subMenu = [];
    document.querySelectorAll('ul.MENU_LIST li').forEach(function(li) {
      var txtEl = li.querySelector('.MENU_TXT');
      if (!txtEl) return;
      var label = txtEl.textContent.trim();
      var actInput = li.querySelector('input[name="act"]');
      if (!actInput) return;
      var act = actInput.value;
      var nxtTabInput = li.querySelector('input[name="NxtTab"]');
      var nxtTab = nxtTabInput ? nxtTabInput.value : null;
      var isActive = li.classList.contains('MENU_OPT_ON');
      var icoEl = li.querySelector('.MENU_ICO');
      var iconName = '';
      if (icoEl && icoEl.style.backgroundImage) {
        var match = icoEl.style.backgroundImage.match(/([^/]+)\\.svg/);
        if (match && match[1]) iconName = match[1];
      }
      subMenu.push({ label: label, act: act, nxtTab: nxtTab, isActive: isActive, originalIcon: iconName });
    });

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'PAGE_STATE',
      hasForm: hasForm,
      isDark: isDark,
      userName: userName,
      userPhoto: userPhoto,
      currentTabKey: currentTabKey,
      subMenu: subMenu
    }));
  } catch(e) {}
})(); true;`;

// ─────────────────────────────────────────────────────────────────────────────
// Cursos
// ─────────────────────────────────────────────────────────────────────────────
const SCRAPE_COURSES_JS = `
(function(){
  try {
    var sel=document.querySelector('select[name="crs"]')
         ||document.querySelector('select[id*="crs"]')
         ||document.querySelector('select[name="course"]');
    if(!sel){
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'COURSES_NOT_FOUND'}));
      return;
    }
    sel.style.setProperty('display', 'none', 'important');
    var opts=Array.from(sel.options).map(function(o){return{value:o.value,label:o.text.trim()};});
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'COURSES_FOUND',courses:opts,current:sel.value}));
  } catch(e) {}
})(); true;`;

const buildChangeCourseJS = (v) => `
(function(){
  try {
    var sel=document.querySelector('select[name="crs"]')
         ||document.querySelector('select[id*="crs"]')
         ||document.querySelector('select[name="course"]');
    if(!sel) return;
    sel.value=${JSON.stringify(v)};
    sel.dispatchEvent(new Event('change',{bubbles:true}));
    var f=sel.closest('form');
    if(f) setTimeout(function(){f.submit();}, 50);
  } catch(e) {}
})(); true;`;

// ─────────────────────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────────────────────
function CourseModal({
  visible,
  courses,
  currentValue,
  onSelect,
  onClose,
  isDark,
}) {
  const insets = useSafeAreaInsets();
  const bg = isDark ? "#2a2a2a" : "#fff";
  const textCol = isDark ? "#f0f0f0" : "#333";
  const handleCol = isDark ? "#555" : "#e0e0e0";
  const sepCol = isDark ? "#444" : "#ececec";
  const activeBg = isDark ? "#442222" : "#fff0f3";
  const activeTextCol = isDark ? "#ff8a9f" : UGR;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={m.overlay} onPress={onClose} />
      <View
        style={[
          m.sheet,
          { paddingBottom: insets.bottom + 8, backgroundColor: bg },
        ]}
      >
        <View style={[m.handle, { backgroundColor: handleCol }]} />
        <Text style={[m.title, { color: textCol }]}>Cambiar asignatura</Text>
        <FlatList
          data={courses}
          keyExtractor={(item) => String(item.value)}
          renderItem={({ item }) => {
            const active = item.value === currentValue;
            return (
              <Pressable
                style={[m.option, active && { backgroundColor: activeBg }]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text
                  style={[
                    m.optionText,
                    { color: textCol },
                    active && { color: activeTextCol, fontWeight: "700" },
                  ]}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
                {active && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={activeTextCol}
                  />
                )}
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => (
            <View style={[m.sep, { backgroundColor: sepCol }]} />
          )}
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
  const insets = useSafeAreaInsets();
  const { session, logout } = useAuth();
  const webRef = useRef(null);

  const loginFiredRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [courses, setCourses] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [showCourses, setShowCourses] = useState(false);
  const [activeTab, setActiveTab] = useState("sta");

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userName, setUserName] = useState("");
  const [userPhoto, setUserPhoto] = useState(null);
  const [dynamicSubMenu, setDynamicSubMenu] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (canGoBack && webRef.current) {
          webRef.current.goBack();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [canGoBack]),
  );

  const handleNavChange = (ns) => {
    if (!ns) return;
    setCanGoBack(ns.canGoBack ?? false);
  };

  const handleLoadEnd = ({ nativeEvent }) => {
    if (!nativeEvent) return;
    setLoading(false);
    webRef.current?.injectJavaScript(INJECTED_CSS_JS);
    setTimeout(() => {
      webRef.current?.injectJavaScript(HIDE_DOM_JS);
      webRef.current?.injectJavaScript(PAGE_STATE_JS);
      webRef.current?.injectJavaScript(SCRAPE_COURSES_JS);
    }, 400);
  };

  const handleMessage = ({ nativeEvent }) => {
    try {
      const msg = JSON.parse(nativeEvent.data);
      switch (msg.type) {
        case "PAGE_STATE":
          setIsDarkMode(msg.isDark);

          // Sincronizamos el estado de la pestaña nativa (para evitar desajustes de iconos)
          if (msg.currentTabKey) {
            setActiveTab(msg.currentTabKey);
          }

          if (msg.hasForm) {
            setLoggedIn(false);
            setCourses([]);
            setCurrentCourse(null);
            setDynamicSubMenu([]);

            if (
              session &&
              session.userId &&
              session.password &&
              !loginFiredRef.current
            ) {
              loginFiredRef.current = true;
              webRef.current?.injectJavaScript(
                buildAutoLoginJS(session.userId, session.password),
              );
            }
          } else {
            setLoggedIn(true);
            loginFiredRef.current = false;
            if (msg.userName) setUserName(msg.userName);
            if (msg.userPhoto) setUserPhoto(msg.userPhoto);
            setDynamicSubMenu(msg.subMenu || []);
          }
          break;
        case "COURSES_FOUND": {
          setCourses(msg.courses || []);
          const found =
            (msg.courses || []).find((c) => c.value === msg.current) ||
            msg.courses?.[0];
          if (found) setCurrentCourse(found);
          break;
        }
      }
    } catch {}
  };

  const handleTab = (tab) => {
    if (tab.key) setActiveTab(tab.key);

    const navScript = `
      (function() {
        var sesInput = document.querySelector('input[name="ses"]');
        var sesToken = sesInput ? sesInput.value : '';
        
        var form = document.createElement('form');
        form.method = 'post';
        form.action = window.location.origin + window.location.pathname; 
        
        var actInput = document.createElement('input');
        actInput.type = 'hidden';
        actInput.name = 'act';
        actInput.value = '${tab.act}';
        form.appendChild(actInput);
        
        ${
          tab.nxtTab
            ? `
        var nxtTabInput = document.createElement('input');
        nxtTabInput.type = 'hidden';
        nxtTabInput.name = 'NxtTab';
        nxtTabInput.value = '${tab.nxtTab}';
        form.appendChild(nxtTabInput);
        `
            : ""
        }
        
        if (sesToken) {
          var sesField = document.createElement('input');
          sesField.type = 'hidden';
          sesField.name = 'ses';
          sesField.value = sesToken;
          form.appendChild(sesField);
        }
        
        document.body.appendChild(form);
        form.submit();
      })(); true;
    `;

    webRef.current?.injectJavaScript(navScript);
  };

  const confirmLogout = () =>
    Alert.alert("Cerrar sesión", "¿Salir de SWAD?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: () => {
          setLoggedIn(false);
          setCourses([]);
          setCurrentCourse(null);
          setDynamicSubMenu([]);
          loginFiredRef.current = false;
          setActiveTab("sta");
          logout();
        },
      },
    ]);

  return (
    <View
      style={[
        s.root,
        {
          paddingTop: insets.top,
          backgroundColor: isDarkMode ? "#1a1a1a" : UGR,
        },
      ]}
    >
      <View style={{ backgroundColor: isDarkMode ? "#1a1a1a" : UGR }}>
        <View style={s.topBar}>
          <Pressable
            style={({ pressed }) => [
              s.navBtn,
              !canGoBack && s.navBtnOff,
              pressed && s.pressed,
            ]}
            onPress={() => webRef.current?.goBack()}
            disabled={!canGoBack}
            hitSlop={5}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.navBtn, pressed && s.pressed]}
            onPress={() => webRef.current?.goForward()}
            hitSlop={5}
          >
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </Pressable>

          {loggedIn && courses.length > 0 ? (
            <Pressable
              style={({ pressed }) => [
                s.courseChip,
                isDarkMode && { backgroundColor: "rgba(255,255,255,0.08)" },
                pressed && { opacity: 0.72 },
              ]}
              onPress={() => setShowCourses(true)}
            >
              <Text style={s.courseChipText} numberOfLines={1}>
                {currentCourse?.label ?? "Asignatura"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={13}
                color="rgba(255,255,255,0.75)"
              />
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {loggedIn && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              <Pressable
                onPress={() => handleTab({ act: "627" })}
                style={s.actionBtn}
                hitSlop={5}
              >
                <Ionicons name="search" size={20} color="#fff" />
              </Pressable>

              <Pressable
                onPress={() => handleTab({ act: "2", nxtTab: "13" })}
                style={s.actionBtn}
                hitSlop={5}
              >
                {userPhoto ? (
                  <Image source={{ uri: userPhoto }} style={s.profileImg} />
                ) : (
                  <Ionicons name="person-circle" size={24} color="#fff" />
                )}
              </Pressable>
            </View>
          )}

          <Pressable style={s.actionBtn} onPress={confirmLogout} hitSlop={10}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </Pressable>
        </View>

        {loggedIn && dynamicSubMenu.length > 0 && (
          <View
            style={[
              s.subBar,
              {
                borderBottomColor: isDarkMode
                  ? "#333"
                  : "rgba(255,255,255,0.2)",
              },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.subBarScroll}
            >
              {dynamicSubMenu.map((item, idx) => (
                <Pressable
                  key={idx}
                  onPress={() =>
                    handleTab({ act: item.act, nxtTab: item.nxtTab })
                  }
                  style={[s.subBarBtn, item.isActive && s.subBarBtnActive]}
                >
                  <Ionicons
                    name={getIonicon(item.originalIcon)}
                    size={20}
                    color={item.isActive ? "#fff" : "rgba(255,255,255,0.65)"}
                  />
                  <Text
                    style={[s.subBarText, item.isActive && s.subBarTextActive]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {loading && (
        <View
          style={[
            s.loadingBar,
            { backgroundColor: isDarkMode ? "#222" : "#fff0f3" },
          ]}
        >
          <ActivityIndicator
            size="small"
            color={isDarkMode ? "#ff8a9f" : UGR}
          />
          <Text
            style={[s.loadingText, { color: isDarkMode ? "#ff8a9f" : UGR }]}
          >
            Cargando…
          </Text>
        </View>
      )}

      <WebView
        ref={webRef}
        source={{ uri: SWAD_HOME }}
        style={[
          s.webview,
          { backgroundColor: isDarkMode ? "#222025" : "#fff" },
        ]}
        onLoadEnd={handleLoadEnd}
        onLoadStart={() => setLoading(true)}
        onNavigationStateChange={handleNavChange}
        onMessage={handleMessage}
        onError={({ nativeEvent }) => {
          setLoading(false);
          Alert.alert("Error", nativeEvent?.description || "Sin conexión.");
        }}
        mixedContentMode="always"
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        scalesPageToFit={Platform.OS === "android"}
        allowsBackForwardNavigationGestures={Platform.OS === "ios"}
        userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      />

      {loggedIn && (
        <View
          style={[
            s.tabBar,
            {
              paddingBottom: insets.bottom || 8,
              backgroundColor: isDarkMode ? "#111" : UGR_DARK,
            },
          ]}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={({ pressed }) => [s.tabBtn, pressed && s.tabPressed]}
                onPress={() => handleTab(tab)}
              >
                <View style={[s.tabIconWrap, active && s.tabIconWrapActive]}>
                  <Ionicons
                    name={active ? tab.iconOn : tab.iconOff}
                    size={20}
                    color={active ? "#fff" : "rgba(255,255,255,0.45)"}
                  />
                </View>
                <Text
                  style={[s.tabLabel, active && s.tabLabelActive]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <CourseModal
        visible={showCourses}
        courses={courses}
        currentValue={currentCourse?.value}
        onSelect={(c) => {
          setCurrentCourse(c);
          webRef.current?.injectJavaScript(buildChangeCourseJS(c.value));
        }}
        onClose={() => setShowCourses(false)}
        isDark={isDarkMode}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const UGR = "#c1002b";
const UGR_DARK = "#9b0022";

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingHorizontal: 4,
    gap: 2,
  },
  subBar: { paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  subBarScroll: { paddingHorizontal: 12, gap: 16 },
  subBarBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minWidth: 50,
  },
  subBarText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    fontWeight: "500",
  },
  subBarTextActive: { color: "#fff", fontWeight: "700" },
  navBtn: {
    width: 32,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  navBtnOff: { opacity: 0.28 },
  pressed: { opacity: 0.5 },
  courseChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginHorizontal: 2,
    gap: 4,
  },
  courseChipText: { flex: 1, color: "#fff", fontWeight: "700", fontSize: 13 },
  actionBtn: {
    width: 32,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },
  loadingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 6,
  },
  loadingText: { fontSize: 11, fontWeight: "500" },
  webview: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  tabBtn: { flex: 1, alignItems: "center", gap: 1 },
  tabPressed: { opacity: 0.55 },
  tabIconWrap: {
    width: 32,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  tabIconWrapActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  tabLabel: { color: "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: "500" },
  tabLabelActive: { color: "#fff", fontWeight: "700" },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.42)" },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "75%",
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  optionText: { flex: 1, fontSize: 14, lineHeight: 20 },
  sep: { height: StyleSheet.hairlineWidth, marginHorizontal: 12 },
});

