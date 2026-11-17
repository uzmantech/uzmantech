(() => {
  const ID = "uzman-asistan-parent-mascot";
  const STYLE_ID = "uzman-asistan-launcher-fix-style";
  const OVERLAY_ID = "uzman-chat-overlay";

  function install() {
    if (!document.body) return;

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `
        #${ID} {
          position: fixed !important;
          right: 14px !important;
          bottom: 14px !important;
          z-index: 2147483002 !important;
          display: grid !important;
          place-items: center !important;
          width: 112px !important;
          height: 142px !important;
          padding: 0 !important;
          margin: 0 !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          cursor: pointer !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        #${ID} svg, #${ID} img {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
        }
        #${OVERLAY_ID} {
          position: fixed !important;
          inset: 0 !important;
          z-index: 2147483001 !important;
        }
        #${OVERLAY_ID} .uz-chat-backdrop {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border: 0 !important;
          background: rgba(3, 12, 24, .22) !important;
        }
        #${OVERLAY_ID} .uz-chat-frame-wrap {
          position: fixed !important; inset: 0 !important;
          width: 100vw !important; height: 100dvh !important; max-height: none !important;
          margin: 0 !important; padding: 0 !important; border: 0 !important;
          border-radius: 0 !important; overflow: hidden !important;
          background: transparent !important; box-shadow: none !important;
        }
        #${OVERLAY_ID} .uz-chat-close { display:none !important; }
        #${OVERLAY_ID} iframe {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          border: 0 !important;
        }
        #${OVERLAY_ID} .uz-chat-close { display:none !important; }
        @media(max-width:560px) {
          #${ID} { width: 88px !important; height: 116px !important; right: 4px !important; bottom: 4px !important; }
          #${OVERLAY_ID} .uz-chat-frame-wrap {
            top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important;
            width: 100vw !important; height: 100dvh !important; max-height: none !important;
            margin: 0 !important; padding: 0 !important; border: 0 !important;
            border-radius: 0 !important; box-shadow: none !important;
          }
          #${OVERLAY_ID} iframe { position:absolute !important; inset:0 !important; width:100% !important; height:100% !important; }
        }`;
      document.head.appendChild(style);
    }

    let launcher = document.getElementById(ID);
    if (!launcher) {
      launcher = document.createElement("button");
      launcher.id = ID;
      launcher.type = "button";
      launcher.setAttribute("aria-label", "UZMAN ASİSTAN sohbetini aç");
      launcher.title = "UZMAN ASİSTAN";
      launcher.innerHTML = "<svg viewBox=\"0 0 120 160\" role=\"img\" aria-label=\"UZMAN robot maskotu\" xmlns=\"http://www.w3.org/2000/svg\"><defs><linearGradient id=\"uzFixBody\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop stop-color=\"#f5fdff\"/><stop offset=\".5\" stop-color=\"#9cc9dd\"/><stop offset=\"1\" stop-color=\"#36728f\"/></linearGradient><linearGradient id=\"uzFixFace\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop stop-color=\"#173b55\"/><stop offset=\"1\" stop-color=\"#061522\"/></linearGradient></defs><ellipse cx=\"60\" cy=\"148\" rx=\"31\" ry=\"5\" fill=\"#00cfff\" opacity=\".28\"/><g stroke=\"#235b78\" stroke-width=\"10\" stroke-linecap=\"round\" fill=\"none\"><path d=\"M42 82 27 99 19 111\"/><path d=\"M49 111 42 132 39 140\"/><path d=\"M71 111 78 132 81 140\"/><path d=\"M78 82 93 99 101 111\"/></g><g fill=\"url(#uzFixBody)\" stroke=\"#6bb8d4\" stroke-width=\"1.5\"><circle cx=\"19\" cy=\"113\" r=\"7\"/><path d=\"M41 77 Q60 69 79 77 L82 111 Q60 123 38 111Z\"/><path d=\"M45 108 39 136 Q39 143 47 143 L54 141 59 116Z\"/><path d=\"M75 108 81 136 Q81 143 73 143 L66 141 61 116Z\"/><rect x=\"13\" y=\"37\" width=\"94\" height=\"57\" rx=\"22\"/><rect x=\"7\" y=\"51\" width=\"12\" height=\"28\" rx=\"6\"/><rect x=\"101\" y=\"51\" width=\"12\" height=\"28\" rx=\"6\"/></g><rect x=\"17\" y=\"42\" width=\"86\" height=\"49\" rx=\"18\" fill=\"url(#uzFixFace)\" stroke=\"#78c6df\"/><path d=\"M36 65 Q43 56 50 65 M70 65 Q77 56 84 65\" fill=\"none\" stroke=\"#00dff5\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M51 75 Q60 80 69 75\" fill=\"none\" stroke=\"#39d9ee\" stroke-width=\"2\" stroke-linecap=\"round\"/><path d=\"M60 12V5\" stroke=\"#48eaff\" stroke-width=\"2.5\"/><circle cx=\"60\" cy=\"5\" r=\"4\" fill=\"#7fffff\"/></svg>";
      document.body.appendChild(launcher);
      launcher.addEventListener("click", openChat);
    }
    if (!launcher.querySelector("svg")) launcher.innerHTML = "<svg viewBox=\"0 0 120 160\" role=\"img\" aria-label=\"UZMAN robot maskotu\" xmlns=\"http://www.w3.org/2000/svg\"><defs><linearGradient id=\"uzFixBody\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop stop-color=\"#f5fdff\"/><stop offset=\".5\" stop-color=\"#9cc9dd\"/><stop offset=\"1\" stop-color=\"#36728f\"/></linearGradient><linearGradient id=\"uzFixFace\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop stop-color=\"#173b55\"/><stop offset=\"1\" stop-color=\"#061522\"/></linearGradient></defs><ellipse cx=\"60\" cy=\"148\" rx=\"31\" ry=\"5\" fill=\"#00cfff\" opacity=\".28\"/><g stroke=\"#235b78\" stroke-width=\"10\" stroke-linecap=\"round\" fill=\"none\"><path d=\"M42 82 27 99 19 111\"/><path d=\"M49 111 42 132 39 140\"/><path d=\"M71 111 78 132 81 140\"/><path d=\"M78 82 93 99 101 111\"/></g><g fill=\"url(#uzFixBody)\" stroke=\"#6bb8d4\" stroke-width=\"1.5\"><circle cx=\"19\" cy=\"113\" r=\"7\"/><path d=\"M41 77 Q60 69 79 77 L82 111 Q60 123 38 111Z\"/><path d=\"M45 108 39 136 Q39 143 47 143 L54 141 59 116Z\"/><path d=\"M75 108 81 136 Q81 143 73 143 L66 141 61 116Z\"/><rect x=\"13\" y=\"37\" width=\"94\" height=\"57\" rx=\"22\"/><rect x=\"7\" y=\"51\" width=\"12\" height=\"28\" rx=\"6\"/><rect x=\"101\" y=\"51\" width=\"12\" height=\"28\" rx=\"6\"/></g><rect x=\"17\" y=\"42\" width=\"86\" height=\"49\" rx=\"18\" fill=\"url(#uzFixFace)\" stroke=\"#78c6df\"/><path d=\"M36 65 Q43 56 50 65 M70 65 Q77 56 84 65\" fill=\"none\" stroke=\"#00dff5\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M51 75 Q60 80 69 75\" fill=\"none\" stroke=\"#39d9ee\" stroke-width=\"2\" stroke-linecap=\"round\"/><path d=\"M60 12V5\" stroke=\"#48eaff\" stroke-width=\"2.5\"/><circle cx=\"60\" cy=\"5\" r=\"4\" fill=\"#7fffff\"/></svg>";
    if (!launcher.dataset.assistantFallbackBound) {
      launcher.addEventListener("click", function (event) {
        event.preventDefault(); event.stopImmediatePropagation(); openChat();
      }, true);
      launcher.dataset.assistantFallbackBound = "1";
    }
    launcher.style.setProperty("visibility", "visible", "important");
  }

  function openChat() {
    if (document.getElementById(OVERLAY_ID)) return;
    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.innerHTML = '<button type="button" class="uz-chat-backdrop" aria-label="Sohbeti kapat"></button><section class="uz-chat-frame-wrap" role="dialog" aria-label="UZMAN ASİSTAN sohbeti"><iframe title="UZMAN ASİSTAN" src="/uzman-asistan.html?widget=1&v=assistant-fallback-20261117-1" allow="clipboard-read; clipboard-write"></iframe></section>';
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    const frame = overlay.querySelector("iframe");
    window.addEventListener("message", function onAssistantNavigate(event) {
      if (event.source !== frame.contentWindow || event.data?.type !== "uzman-asistan-navigate" || typeof event.data.url !== "string" || !/^\/(paketler|kayit|odeme)\.html(?:\?|$)/.test(event.data.url)) return;
      let page = overlay.querySelector("#uzman-package-background");
      if (!page) {
        page = document.createElement("iframe");
        page.id = "uzman-package-background";
        page.title = "Uzmantech Paketler";
        page.src = event.data.url;
        page.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:1;background:#080e19";
        overlay.appendChild(page);
      }
      overlay.querySelector(".uz-chat-backdrop").style.display = "none";
      const wrap = overlay.querySelector(".uz-chat-frame-wrap");
      wrap.style.cssText += ";position:fixed!important;top:auto!important;left:auto!important;right:18px!important;bottom:18px!important;width:min(450px,calc(100vw - 36px))!important;height:min(700px,calc(100dvh - 36px))!important;max-height:none!important;z-index:2!important;border:1px solid #dbe4f0!important;border-radius:20px!important;overflow:hidden!important;box-shadow:0 20px 60px #0008!important;background:#fff!important";
    });
    window.addEventListener("message", function onAssistantMessage(event) {
      if (event.source === frame.contentWindow && event.data?.type === "uzman-asistan-close") {
        close();
        window.removeEventListener("message", onAssistantMessage);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();