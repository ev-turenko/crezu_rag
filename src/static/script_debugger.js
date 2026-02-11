class ScriptDebugger {
  loadedScripts = new Set()
  scriptIndex = 0

  constructor() {
    this.config = {
      enabled: false,
      blockAll: false,
      blockedScripts: new Set(),
      allowedScripts: new Set(),
      logEvents: false,
      blockDuplicates: false,
      blockIndices: new Set()
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

      this.interceptScripts()
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

  listBlockedScripts() {
    console.table(Array.from(this.config.blockedScripts))
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

  clearLoadedScripts() {
    this.loadedScripts.clear()
    console.log(
      "%c[Script Debugger] Cleared loaded scripts cache",
      "color: #00ff00"
    )
  }

  getCurrentScriptIndex() {
    return this.scriptIndex
  }

  resetScriptIndex() {
    this.scriptIndex = 0
    console.log(
      "%c[Script Debugger] Reset script index counter",
      "color: #00ff00"
    )
  }
}

// Initialize debugger
if (typeof window !== "undefined") {
  window.scriptDebugger = new ScriptDebugger()
}
