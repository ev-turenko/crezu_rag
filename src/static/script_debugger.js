/**
 * Script Debugger - URL Query Parameters
 * 
 * 
 * GENERAL:
 * ?debug_scripts=true          - Enable the script debugger
 * &block_all=true              - Block ALL scripts and CSS
 * &block_duplicates=true       - Block duplicate scripts and CSS files
 * &log_events=true             - Log all DOM events
 * 
 * SCRIPT BLOCKING:
 * &block_script=file1.js,file2.js     - Block specific scripts (comma-separated)
 * &allow_only=file1.js,file2.js       - Allow ONLY these scripts (whitelist mode)
 * &block_index=0,2,5                  - Block scripts by their load index
 * 
 * CSS BLOCKING:
 * &block_css=file1.css,file2.css      - Block specific CSS files (comma-separated)
 * &allow_css_only=file1.css           - Allow ONLY these CSS files (whitelist mode)
 * &block_css_index=0,2,5              - Block CSS by their load index
 * 
 * EXAMPLES:
 * ?debug_scripts=true&block_script=analytics.js,tracking.js
 * ?debug_scripts=true&allow_only=main.js&allow_css_only=styles.css
 * ?debug_scripts=true&block_duplicates=true&log_events=true
 * ?debug_scripts=true&block_index=0,1&block_css_index=2
 * 
 * PUBLIC API (window.scriptDebugger):
 * .blockScript(identifier)      - Block a script at runtime
 * .allowScript(identifier)      - Unblock a script
 * .blockStyle(identifier)       - Block a CSS file at runtime
 * .allowStyle(identifier)       - Unblock a CSS file
 * .listBlockedScripts()         - Show all blocked scripts
 * .listBlockedStyles()          - Show all blocked CSS files
 * .listLoadedScripts()          - Show all loaded scripts
 * .listLoadedStyles()           - Show all loaded CSS files
 * .clearLoadedScripts()         - Clear script cache
 * .clearLoadedStyles()          - Clear CSS cache
 * .getCurrentScriptIndex()      - Get current script index
 * .getCurrentStyleIndex()       - Get current CSS index
 * .resetScriptIndex()           - Reset script counter
 * .resetStyleIndex()            - Reset CSS counter
 * .enableEventLogging()         - Enable event logging at runtime
 * .getConfig()                  - Get current configuration
 */

class ScriptDebugger {
  loadedScripts = new Set()
  scriptIndex = 0
  loadedStyles = new Set()
  styleIndex = 0

  constructor() {
    this.config = {
      enabled: false,
      blockAll: false,
      blockedScripts: new Set(),
      allowedScripts: new Set(),
      blockedStyles: new Set(),
      allowedStyles: new Set(),
      logEvents: false,
      blockDuplicates: false,
      blockIndices: new Set(),
      styleBlockIndices: new Set()
    }

    this.originalDispatchEvent = window.dispatchEvent.bind(window)
    this.originalAddEventListener = window.addEventListener.bind(window)

    this.init()
  }

  init() {
    if (typeof window === "undefined") return

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const debugScripts =
      urlParams.get("debug_scripts") || localStorage.getItem("debug_scripts")

    if (debugScripts === "true") {
      this.config.enabled = true
      console.log(
        "%c[Script Debugger] Enabled",
        "color: #00ff00; font-weight: bold"
      )

      // Block all scripts option
      if (urlParams.get("block_all") === "true") {
        this.config.blockAll = true
        console.log(
          "%c[Script Debugger] Blocking ALL scripts",
          "color: #ff6600; font-weight: bold"
        )
      }

      // Block specific scripts
      const blockList = urlParams.get("block_script")
      if (blockList) {
        blockList
          .split(",")
          .forEach(script => this.config.blockedScripts.add(script.trim()))
        console.log(
          "%c[Script Debugger] Blocked scripts:",
          "color: #ff6600",
          Array.from(this.config.blockedScripts)
        )
      }

      // Allow only specific scripts
      const allowList = urlParams.get("allow_only")
      if (allowList) {
        allowList
          .split(",")
          .forEach(script => this.config.allowedScripts.add(script.trim()))
        console.log(
          "%c[Script Debugger] Allowed scripts only:",
          "color: #00ff00",
          Array.from(this.config.allowedScripts)
        )
      }

      // Log events
      if (urlParams.get("log_events") === "true") {
        this.config.logEvents = true
        this.interceptEvents()
      }

      // Block duplicates
      if (urlParams.get("block_duplicates") === "true") {
        this.config.blockDuplicates = true
        console.log(
          "%c[Script Debugger] Blocking duplicate scripts",
          "color: #ff9900; font-weight: bold"
        )
      }

      // Block by indices
      const blockIndices = urlParams.get("block_index")
      if (blockIndices) {
        blockIndices.split(",").forEach(idx => {
          const index = parseInt(idx.trim(), 10)
          if (!isNaN(index)) {
            this.config.blockIndices.add(index)
          }
        })
        console.log(
          "%c[Script Debugger] Blocking script indices:",
          "color: #ff00ff; font-weight: bold",
          Array.from(this.config.blockIndices)
        )
      }

      // Block specific CSS files
      const blockStyleList = urlParams.get("block_css")
      if (blockStyleList) {
        blockStyleList
          .split(",")
          .forEach(style => this.config.blockedStyles.add(style.trim()))
        console.log(
          "%c[Script Debugger] Blocked CSS files:",
          "color: #ff6600",
          Array.from(this.config.blockedStyles)
        )
      }

      // Allow only specific CSS files
      const allowStyleList = urlParams.get("allow_css_only")
      if (allowStyleList) {
        allowStyleList
          .split(",")
          .forEach(style => this.config.allowedStyles.add(style.trim()))
        console.log(
          "%c[Script Debugger] Allowed CSS files only:",
          "color: #00ff00",
          Array.from(this.config.allowedStyles)
        )
      }

      // Block CSS by indices
      const blockStyleIndices = urlParams.get("block_css_index")
      if (blockStyleIndices) {
        blockStyleIndices.split(",").forEach(idx => {
          const index = parseInt(idx.trim(), 10)
          if (!isNaN(index)) {
            this.config.styleBlockIndices.add(index)
          }
        })
        console.log(
          "%c[Script Debugger] Blocking CSS indices:",
          "color: #ff00ff; font-weight: bold",
          Array.from(this.config.styleBlockIndices)
        )
      }

      this.interceptScripts()
      this.interceptStyles()
    }
  }

  normalizeUrl(url) {
    try {
      const urlObj = new URL(url, window.location.href)
      return urlObj.origin + urlObj.pathname
    } catch {
      return url
    }
  }

  checkDuplicate(scriptSrc) {
    const normalized = this.normalizeUrl(scriptSrc)
    return this.loadedScripts.has(normalized)
  }

  trackScript(scriptSrc) {
    const normalized = this.normalizeUrl(scriptSrc)
    this.loadedScripts.add(normalized)
  }

  checkDuplicateStyle(styleSrc) {
    const normalized = this.normalizeUrl(styleSrc)
    return this.loadedStyles.has(normalized)
  }

  trackStyle(styleSrc) {
    const normalized = this.normalizeUrl(styleSrc)
    this.loadedStyles.add(normalized)
  }

  interceptScripts() {
    // Intercept script creation
    const originalCreateElement = document.createElement.bind(document)

    document.createElement = function(tagName, options) {
      const element = originalCreateElement(tagName, options)

      if (
        tagName.toLowerCase() === "script" &&
        element instanceof HTMLScriptElement
      ) {
        const scriptDebugger = window.scriptDebugger

        // Monitor src changes
        const originalSrcDescriptor = Object.getOwnPropertyDescriptor(
          HTMLScriptElement.prototype,
          "src"
        )
        Object.defineProperty(element, "src", {
          set(value) {
            const currentIndex = scriptDebugger.scriptIndex++
            const isDuplicate = scriptDebugger.checkDuplicate(value)
            const isIndexBlocked = scriptDebugger.config.blockIndices.has(
              currentIndex
            )

            const labels = []
            const styles = []

            if (isIndexBlocked) {
              labels.push("%c[INDEX:" + currentIndex + "]%c ")
              styles.push("color: #ff00ff; font-weight: bold", "")
            }
            if (isDuplicate) {
              labels.push("%c[DUPLICATE]%c ")
              styles.push("color: #ff9900; font-weight: bold", "")
            }
            if (!isIndexBlocked && !isDuplicate) {
              labels.push("%c[INDEX:" + currentIndex + "]%c ")
              styles.push("color: #888888", "")
            }

            const labelStr = labels.join("")

            if (scriptDebugger.shouldBlockScript(value)) {
              console.log(
                "%c[Script Debugger] BLOCKED:" +
                  (labelStr ? " " + labelStr : ""),
                "color: #ff0000; font-weight: bold",
                ...styles,
                value
              )
              return // Don't set the src, effectively blocking the script
            }

            if (isIndexBlocked) {
              console.log(
                "%c[Script Debugger] BLOCKED:" + " " + labelStr,
                "color: #ff0000; font-weight: bold",
                ...styles,
                value
              )
              return
            }

            if (isDuplicate && scriptDebugger.config.blockDuplicates) {
              console.log(
                "%c[Script Debugger] BLOCKED:" + " " + labelStr,
                "color: #ff0000; font-weight: bold",
                ...styles,
                value
              )
              return
            }

            console.log(
              "%c[Script Debugger] ALLOWED:" + (labelStr ? " " + labelStr : ""),
              "color: #00ff00",
              ...styles,
              value
            )

            scriptDebugger.trackScript(value)

            if (originalSrcDescriptor?.set) {
              originalSrcDescriptor.set.call(this, value)
            }
          },
          get() {
            return originalSrcDescriptor?.get?.call(this) || ""
          }
        })
      }

      return element
    }

    // Intercept appendChild to catch scripts
    const originalAppendChild = Element.prototype.appendChild
    Element.prototype.appendChild = function(node) {
      if (node instanceof HTMLScriptElement && window.scriptDebugger) {
        const scriptDebugger = window.scriptDebugger
        const src = node.src || node.getAttribute("src") || "inline-script"
        const currentIndex = scriptDebugger.scriptIndex++
        const isDuplicate = scriptDebugger.checkDuplicate(src)
        const isIndexBlocked = scriptDebugger.config.blockIndices.has(
          currentIndex
        )

        const labels = []
        const styles = []

        if (isIndexBlocked) {
          labels.push("%c[INDEX:" + currentIndex + "]%c ")
          styles.push("color: #ff00ff; font-weight: bold", "")
        }
        if (isDuplicate) {
          labels.push("%c[DUPLICATE]%c ")
          styles.push("color: #ff9900; font-weight: bold", "")
        }
        if (!isIndexBlocked && !isDuplicate) {
          labels.push("%c[INDEX:" + currentIndex + "]%c ")
          styles.push("color: #888888", "")
        }

        const labelStr = labels.join("")

        if (scriptDebugger.shouldBlockScript(src)) {
          console.log(
            "%c[Script Debugger] BLOCKED appendChild:" +
              (labelStr ? " " + labelStr : ""),
            "color: #ff0000; font-weight: bold",
            ...styles,
            src
          )
          return node // Return the node but don't append it
        }

        if (isIndexBlocked) {
          console.log(
            "%c[Script Debugger] BLOCKED appendChild:" + " " + labelStr,
            "color: #ff0000; font-weight: bold",
            ...styles,
            src
          )
          return node
        }

        if (isDuplicate && scriptDebugger.config.blockDuplicates) {
          console.log(
            "%c[Script Debugger] BLOCKED appendChild:" + " " + labelStr,
            "color: #ff0000; font-weight: bold",
            ...styles,
            src
          )
          return node
        }

        console.log(
          "%c[Script Debugger] ALLOWED appendChild:" +
            (labelStr ? " " + labelStr : ""),
          "color: #00ff00",
          ...styles,
          src
        )

        scriptDebugger.trackScript(src)
      }
      return originalAppendChild.call(this, node)
    }
  }

  interceptStyles() {
    // Intercept link element creation for CSS
    const originalCreateElement = document.createElement
    const scriptDebugger = this

    document.createElement = function(tagName, options) {
      const element = originalCreateElement.call(document, tagName, options)

      if (
        tagName.toLowerCase() === "link" &&
        element instanceof HTMLLinkElement
      ) {
        // Monitor href changes
        const originalHrefDescriptor = Object.getOwnPropertyDescriptor(
          HTMLLinkElement.prototype,
          "href"
        )
        Object.defineProperty(element, "href", {
          set(value) {
            // Only intercept stylesheet links
            if (this.rel !== "stylesheet" && this.getAttribute("rel") !== "stylesheet") {
              if (originalHrefDescriptor?.set) {
                originalHrefDescriptor.set.call(this, value)
              }
              return
            }

            const currentIndex = scriptDebugger.styleIndex++
            const isDuplicate = scriptDebugger.checkDuplicateStyle(value)
            const isIndexBlocked = scriptDebugger.config.styleBlockIndices.has(
              currentIndex
            )

            const labels = []
            const styles = []

            if (isIndexBlocked) {
              labels.push("%c[CSS INDEX:" + currentIndex + "]%c ")
              styles.push("color: #ff00ff; font-weight: bold", "")
            }
            if (isDuplicate) {
              labels.push("%c[DUPLICATE]%c ")
              styles.push("color: #ff9900; font-weight: bold", "")
            }
            if (!isIndexBlocked && !isDuplicate) {
              labels.push("%c[CSS INDEX:" + currentIndex + "]%c ")
              styles.push("color: #888888", "")
            }

            const labelStr = labels.join("")

            if (scriptDebugger.shouldBlockStyle(value)) {
              console.log(
                "%c[Script Debugger] BLOCKED CSS:" +
                  (labelStr ? " " + labelStr : ""),
                "color: #ff0000; font-weight: bold",
                ...styles,
                value
              )
              return // Don't set the href, effectively blocking the CSS
            }

            if (isIndexBlocked) {
              console.log(
                "%c[Script Debugger] BLOCKED CSS:" + " " + labelStr,
                "color: #ff0000; font-weight: bold",
                ...styles,
                value
              )
              return
            }

            if (isDuplicate && scriptDebugger.config.blockDuplicates) {
              console.log(
                "%c[Script Debugger] BLOCKED CSS:" + " " + labelStr,
                "color: #ff0000; font-weight: bold",
                ...styles,
                value
              )
              return
            }

            console.log(
              "%c[Script Debugger] ALLOWED CSS:" + (labelStr ? " " + labelStr : ""),
              "color: #00ff00",
              ...styles,
              value
            )

            scriptDebugger.trackStyle(value)

            if (originalHrefDescriptor?.set) {
              originalHrefDescriptor.set.call(this, value)
            }
          },
          get() {
            return originalHrefDescriptor?.get?.call(this) || ""
          }
        })
      }

      return element
    }

    // Intercept appendChild and insertBefore for link elements
    const originalAppendChild = Element.prototype.appendChild
    const originalInsertBefore = Element.prototype.insertBefore

    Element.prototype.appendChild = function(node) {
      if (node instanceof HTMLLinkElement && node.rel === "stylesheet" && window.scriptDebugger) {
        const scriptDebugger = window.scriptDebugger
        const href = node.href || node.getAttribute("href") || "inline-style"
        const currentIndex = scriptDebugger.styleIndex++
        const isDuplicate = scriptDebugger.checkDuplicateStyle(href)
        const isIndexBlocked = scriptDebugger.config.styleBlockIndices.has(
          currentIndex
        )

        const labels = []
        const styles = []

        if (isIndexBlocked) {
          labels.push("%c[CSS INDEX:" + currentIndex + "]%c ")
          styles.push("color: #ff00ff; font-weight: bold", "")
        }
        if (isDuplicate) {
          labels.push("%c[DUPLICATE]%c ")
          styles.push("color: #ff9900; font-weight: bold", "")
        }
        if (!isIndexBlocked && !isDuplicate) {
          labels.push("%c[CSS INDEX:" + currentIndex + "]%c ")
          styles.push("color: #888888", "")
        }

        const labelStr = labels.join("")

        if (scriptDebugger.shouldBlockStyle(href)) {
          console.log(
            "%c[Script Debugger] BLOCKED appendChild CSS:" +
              (labelStr ? " " + labelStr : ""),
            "color: #ff0000; font-weight: bold",
            ...styles,
            href
          )
          return node // Return the node but don't append it
        }

        if (isIndexBlocked) {
          console.log(
            "%c[Script Debugger] BLOCKED appendChild CSS:" + " " + labelStr,
            "color: #ff0000; font-weight: bold",
            ...styles,
            href
          )
          return node
        }

        if (isDuplicate && scriptDebugger.config.blockDuplicates) {
          console.log(
            "%c[Script Debugger] BLOCKED appendChild CSS:" + " " + labelStr,
            "color: #ff0000; font-weight: bold",
            ...styles,
            href
          )
          return node
        }

        console.log(
          "%c[Script Debugger] ALLOWED appendChild CSS:" +
            (labelStr ? " " + labelStr : ""),
          "color: #00ff00",
          ...styles,
          href
        )

        scriptDebugger.trackStyle(href)
      }
      return originalAppendChild.call(this, node)
    }

    Element.prototype.insertBefore = function(node, referenceNode) {
      if (node instanceof HTMLLinkElement && node.rel === "stylesheet" && window.scriptDebugger) {
        const scriptDebugger = window.scriptDebugger
        const href = node.href || node.getAttribute("href") || "inline-style"
        const currentIndex = scriptDebugger.styleIndex++
        const isDuplicate = scriptDebugger.checkDuplicateStyle(href)
        const isIndexBlocked = scriptDebugger.config.styleBlockIndices.has(
          currentIndex
        )

        const labels = []
        const styles = []

        if (isIndexBlocked) {
          labels.push("%c[CSS INDEX:" + currentIndex + "]%c ")
          styles.push("color: #ff00ff; font-weight: bold", "")
        }
        if (isDuplicate) {
          labels.push("%c[DUPLICATE]%c ")
          styles.push("color: #ff9900; font-weight: bold", "")
        }
        if (!isIndexBlocked && !isDuplicate) {
          labels.push("%c[CSS INDEX:" + currentIndex + "]%c ")
          styles.push("color: #888888", "")
        }

        const labelStr = labels.join("")

        if (scriptDebugger.shouldBlockStyle(href)) {
          console.log(
            "%c[Script Debugger] BLOCKED insertBefore CSS:" +
              (labelStr ? " " + labelStr : ""),
            "color: #ff0000; font-weight: bold",
            ...styles,
            href
          )
          return node // Return the node but don't insert it
        }

        if (isIndexBlocked) {
          console.log(
            "%c[Script Debugger] BLOCKED insertBefore CSS:" + " " + labelStr,
            "color: #ff0000; font-weight: bold",
            ...styles,
            href
          )
          return node
        }

        if (isDuplicate && scriptDebugger.config.blockDuplicates) {
          console.log(
            "%c[Script Debugger] BLOCKED insertBefore CSS:" + " " + labelStr,
            "color: #ff0000; font-weight: bold",
            ...styles,
            href
          )
          return node
        }

        console.log(
          "%c[Script Debugger] ALLOWED insertBefore CSS:" +
            (labelStr ? " " + labelStr : ""),
          "color: #00ff00",
          ...styles,
          href
        )

        scriptDebugger.trackStyle(href)
      }
      return originalInsertBefore.call(this, node, referenceNode)
    }
  }

  interceptEvents() {
    // Intercept dispatchEvent
    window.dispatchEvent = event => {
      console.log("%c[Event Dispatch]", "color: #0099ff; font-weight: bold", {
        type: event.type,
        timestamp: new Date().toISOString(),
        event,
        stackTrace: new Error().stack
      })
      return this.originalDispatchEvent(event)
    }

    // Intercept addEventListener
    window.addEventListener = (type, listener, options) => {
      console.log(
        "%c[Event Listener Added]",
        "color: #9900ff; font-weight: bold",
        {
          type,
          timestamp: new Date().toISOString(),
          listener: listener.toString().slice(0, 100) + "...",
          stackTrace: new Error().stack
        }
      )
      return this.originalAddEventListener(type, listener, options)
    }
  }

  shouldBlockScript(scriptSrc) {
    if (!this.config.enabled) return false
    if (this.config.blockAll) return true

    // Check if using allow-list mode
    if (this.config.allowedScripts.size > 0) {
      return !Array.from(this.config.allowedScripts).some(allowed =>
        scriptSrc.includes(allowed)
      )
    }

    // Check block-list mode
    return Array.from(this.config.blockedScripts).some(blocked =>
      scriptSrc.includes(blocked)
    )
  }

  shouldBlockStyle(styleSrc) {
    if (!this.config.enabled) return false
    if (this.config.blockAll) return true

    // Check if using allow-list mode
    if (this.config.allowedStyles.size > 0) {
      return !Array.from(this.config.allowedStyles).some(allowed =>
        styleSrc.includes(allowed)
      )
    }

    // Check block-list mode
    return Array.from(this.config.blockedStyles).some(blocked =>
      styleSrc.includes(blocked)
    )
  }

  // Public API for runtime control
  blockScript(identifier) {
    this.config.blockedScripts.add(identifier)
    console.log(
      "%c[Script Debugger] Added to blocklist:",
      "color: #ff6600",
      identifier
    )
  }

  allowScript(identifier) {
    this.config.blockedScripts.delete(identifier)
    console.log(
      "%c[Script Debugger] Removed from blocklist:",
      "color: #00ff00",
      identifier
    )
  }

  blockStyle(identifier) {
    this.config.blockedStyles.add(identifier)
    console.log(
      "%c[Script Debugger] Added CSS to blocklist:",
      "color: #ff6600",
      identifier
    )
  }

  allowStyle(identifier) {
    this.config.blockedStyles.delete(identifier)
    console.log(
      "%c[Script Debugger] Removed CSS from blocklist:",
      "color: #00ff00",
      identifier
    )
  }

  listBlockedScripts() {
    console.table(Array.from(this.config.blockedScripts))
  }

  listBlockedStyles() {
    console.table(Array.from(this.config.blockedStyles))
  }

  enableEventLogging() {
    if (!this.config.logEvents) {
      this.config.logEvents = true
      this.interceptEvents()
    }
  }

  getConfig() {
    return { ...this.config }
  }

  listLoadedScripts() {
    console.table(Array.from(this.loadedScripts))
  }

  listLoadedStyles() {
    console.table(Array.from(this.loadedStyles))
  }

  clearLoadedScripts() {
    this.loadedScripts.clear()
    console.log(
      "%c[Script Debugger] Cleared loaded scripts cache",
      "color: #00ff00"
    )
  }

  clearLoadedStyles() {
    this.loadedStyles.clear()
    console.log(
      "%c[Script Debugger] Cleared loaded styles cache",
      "color: #00ff00"
    )
  }

  getCurrentScriptIndex() {
    return this.scriptIndex
  }

  getCurrentStyleIndex() {
    return this.styleIndex
  }

  resetScriptIndex() {
    this.scriptIndex = 0
    console.log(
      "%c[Script Debugger] Reset script index counter",
      "color: #00ff00"
    )
  }

  resetStyleIndex() {
    this.styleIndex = 0
    console.log(
      "%c[Script Debugger] Reset CSS index counter",
      "color: #00ff00"
    )
  }
}

// Initialize debugger
if (typeof window !== "undefined") {
  window.scriptDebugger = new ScriptDebugger()
}
