const mq = window.matchMedia('(prefers-color-scheme: dark)')
function applyTheme(e) {
  document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
}
applyTheme(mq)
mq.addEventListener('change', applyTheme)

function loadContent() {
  try {
    const data = JSON.parse(document.getElementById('siteData').textContent)
    document.title = data.page_title
    document.querySelector('.title').innerHTML = data.title
    document.querySelector('.subtitle').textContent = data.subtitle
    document.querySelector('.tagline').textContent = data.tagline
    const links = document.querySelector('.links')
    links.innerHTML = data.links.map(l =>
      `<a href="${l.url}" target="_blank"${l.rel ? ` rel="${l.rel}"` : ''}>${l.label}</a>`
    ).join('')
    const bc = document.querySelector('.body__content')
    bc.innerHTML = data.body.map(p =>
      `<p>${p}</p>`
    ).join('')
    const f = document.querySelector('.footer')
    f.children[0].innerHTML = data.footer.copyright
    f.children[1].innerHTML = data.footer.tag
  } catch (e) {
    console.error('Failed to load content:', e)
  }
}
loadContent()

const palette = ['--red', '--shape-yellow', '--shape-blue', '--shape-black']
const shapes = document.querySelectorAll('.shape')
let shift = 0
let dragActive = false

const clickPulse = {
  'shape--circle': { transform: 'scale(0.93) translateY(-4px)' },
  'shape--square': { transform: 'rotate(-12deg) scale(1) translateY(-4px)' },
  'shape--line-h': { transform: 'scaleX(0.85) translateY(-4px)' },
  'shape--line-v': { transform: 'scaleY(0.9) translateX(-4px)' },
  'shape--dot': { transform: 'scale(0.7) translateY(-4px)' },
}

let lastCycleShape = null
let lastCycleTime = 0

function cycleShapeColor(shape) {
  const now = Date.now()
  if (shape === lastCycleShape && now - lastCycleTime < 300) return
  lastCycleShape = shape
  lastCycleTime = now
  const cls = [...shape.classList].find(c => clickPulse[c])
  if (cls) {
    shape._clickAnim && shape._clickAnim.cancel()
    const from = getComputedStyle(shape).transform
    const kf = [
      { transform: from },
      clickPulse[cls],
      { transform: from },
    ]
    shape._clickAnim = shape.animate(kf, { duration: 250, easing: 'ease-out' })
  }
  shift = (shift + 1) % palette.length
  shapes.forEach((s, i) => {
    s.style.background = `var(${palette[(i + shift) % palette.length]})`
  })
}

shapes.forEach(shape => {
  shape.style.cursor = 'pointer'
  shape.addEventListener('click', () => {
    if (dragActive) return
    cycleShapeColor(shape)
  })
})

const wraps = document.querySelectorAll('.shape-wrap')
const shapesEl = document.querySelector('.shapes')
const origPos = []

function captureOrigPos() {
  wraps.forEach(w => { w.style.animation = 'none' })
  const pr = shapesEl.getBoundingClientRect()
  wraps.forEach((w, i) => {
    const wr = w.getBoundingClientRect()
    origPos[i] = { left: wr.left - pr.left, top: wr.top - pr.top }
  })
  wraps.forEach(w => { w.style.animation = '' })
}

const layouts = [
  null,
  [
    { top: '0', left: '0' },
    { bottom: '40px', right: '0' },
    { bottom: '0', left: '0' },
    { top: '20px', left: '20px' },
    { bottom: '80px', left: '100px' },
  ],
  [
    { right: '10%', bottom: '0' },
    { top: '40%', left: '0' },
    { top: '30%', right: '0' },
    { top: '10px', left: '20px' },
    { top: '60%', right: '30%' },
  ],
  [
    { bottom: '0', right: '20%' },
    { top: '10px', left: '20%' },
    { top: '0', left: '10px' },
    { top: '0', right: '20%' },
    { bottom: '60%', right: '5%' },
  ],
  [
    { top: '0', right: '0' },
    { bottom: '10px', right: '10%' },
    { bottom: '0', left: '20%' },
    { top: '20px', left: '0' },
    { top: '40%', right: '40%' },
  ],
]

let activeLayout = 0
let shapesManual = false

function applyLayout() {
  if (shapesManual) return
  wraps.forEach((w, i) => {
    w.style.left = ''
    w.style.top = ''
    w.style.right = ''
    w.style.bottom = ''
  })
  if (window.innerWidth > 768 && activeLayout > 0) {
    const pos = layouts[activeLayout]
    wraps.forEach((w, i) => {
      if (pos[i]) {
        for (const prop in pos[i]) {
          w.style[prop] = pos[i][prop]
        }
      }
    })
  }
}

activeLayout = Math.floor(Math.random() * layouts.length)

const bp = window.matchMedia('(max-width: 768px)')
bp.addEventListener('change', () => {
  applyLayout()
  captureOrigPos()
})

if (document.readyState === 'complete') {
  applyLayout()
  captureOrigPos()
} else {
  window.addEventListener('load', () => {
    applyLayout()
    captureOrigPos()
  })
}

wraps.forEach((w, i) => {
  w.addEventListener('mousedown', onDragStart)
  w.addEventListener('touchstart', onDragStart, { passive: false })
})

let dragWrap = null
let startX, startY, startLeft, startTop
let hasMoved = false

function freezeForDrag() {
  if (!dragWrap || dragWrap._frozen) return
  const rect = dragWrap.getBoundingClientRect()
  const parentRect = shapesEl.getBoundingClientRect()
  const cs = getComputedStyle(dragWrap)
  dragWrap._savedTransform = cs.transform
  dragWrap._frozen = true
  dragWrap.style.transition = 'none'
  dragWrap.style.animationPlayState = 'paused'
  dragWrap.style.transform = 'none'
  dragWrap.style.left = (rect.left - parentRect.left) + 'px'
  dragWrap.style.top = (rect.top - parentRect.top) + 'px'
  dragWrap.style.right = 'auto'
  dragWrap.style.bottom = 'auto'
  dragWrap.style.zIndex = '10'
  dragWrap.style.cursor = 'grabbing'
  startLeft = parseFloat(dragWrap.style.left)
  startTop = parseFloat(dragWrap.style.top)
}

function onDragStart(e) {
  const touch = e.touches ? e.touches[0] : e
  dragWrap = this
  hasMoved = false
  shapesManual = true
  startX = touch.clientX
  startY = touch.clientY
  if (!e.touches) e.preventDefault()
}

document.addEventListener('mousemove', onDragMove)
document.addEventListener('touchmove', onDragMove, { passive: false })

function onDragMove(e) {
  if (!dragWrap) return
  const touch = e.touches ? e.touches[0] : e
  const dx = touch.clientX - startX
  const dy = touch.clientY - startY
  const threshold = e.touches ? 15 : 2
  if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
    hasMoved = true
    dragActive = true
    freezeForDrag()
  }
  if (!hasMoved) return
  const angle = Math.atan2(dy, dx) * (180 / Math.PI) * 0.08

  dragWrap.style.left = (startLeft + dx) + 'px'
  dragWrap.style.top = (startTop + dy) + 'px'
  dragWrap.style.transform = `rotate(${angle}deg)`

  e.preventDefault()
}

let shapesHome = true

document.getElementById('resetBtn').addEventListener('click', () => {
  const spring = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  if (shapesHome) {
    const pr = shapesEl.getBoundingClientRect()
    wraps.forEach((w, i) => {
      const wr = w.getBoundingClientRect()
      w.style.transition = 'none'
      w.style.animationPlayState = 'paused'
      w.style.left = (wr.left - pr.left) + 'px'
      w.style.top = (wr.top - pr.top) + 'px'
      w.style.right = 'auto'
      w.style.bottom = 'auto'
      w.style.transform = 'none'
      void w.offsetHeight
      const maxX = pr.width - wr.width
      const maxY = pr.height - wr.height
      const randX = 10 + Math.random() * (maxX - 20)
      const randY = 10 + Math.random() * (maxY - 20)
      w.style.transition = `left 0.5s ${spring}, top 0.5s ${spring}, transform 0.3s ease`
      w.style.left = randX + 'px'
      w.style.top = randY + 'px'
      w.style.transform = `rotate(${(Math.random() - 0.5) * 20}deg)`
    })
    shapesHome = false
    shapesManual = true
  } else {
    wraps.forEach((w, i) => {
      if (origPos[i]) {
        w.style.transition = `left 0.6s ${spring}, top 0.6s ${spring}, transform 0.4s ease`
        w.style.animationPlayState = 'paused'
        w.style.left = origPos[i].left + 'px'
        w.style.top = origPos[i].top + 'px'
        w.style.transform = 'rotate(0deg)'
      }
    })
    setTimeout(() => {
      wraps.forEach(w => {
        w.style.right = ''
        w.style.bottom = ''
        w.style.zIndex = ''
        w.style.transition = ''
        w.style.transform = ''
        w.getAnimations().forEach(a => { a.currentTime = 0 })
        w.style.animationPlayState = 'running'
      })
      shapesHome = true
      shapesManual = false
      applyLayout()
    }, 650)
  }
})

document.addEventListener('mouseup', onDragEnd)
document.addEventListener('touchend', onDragEnd)

function onDragEnd(e) {
  if (!dragWrap) return
  const wrap = dragWrap
  const wasTouch = e && e.changedTouches !== undefined
  dragActive = false
  if (!hasMoved) {
    if (wasTouch) {
      const shape = wrap.querySelector('.shape')
      cycleShapeColor(shape)
    }
    delete wrap._savedTransform
    delete wrap._frozen
    dragWrap = null
    return
  }
  shapesHome = false
  wrap.style.transition = 'transform 0.2s ease'
  wrap.style.transform = 'rotate(0deg)'
  wrap.style.zIndex = ''
  wrap.style.cursor = 'grab'
  wrap.style.animationPlayState = 'paused'
  setTimeout(() => {
    wrap.style.transition = ''
  }, 200)
  delete wrap._savedTransform
  delete wrap._frozen
  dragWrap = null
}
