'us strict'

function Noodle () {
  this.el = document.createElement('canvas')
  this.context = this.el.getContext('2d')
  this.ratio = window.devicePixelRatio

  const cursor = { z: 0, a: { x: 0, y: 0 }, b: { x: 0, y: 0 }, size: 12, mode: null, color: 'black' }

  this.install = function (host) {
    host.appendChild(this.el)

    window.addEventListener('mousedown', this.onMouseDown, false)
    window.addEventListener('mousemove', this.onMouseMove, false)
    window.addEventListener('mouseup', this.onMouseUp, false)
    window.addEventListener('keydown', this.onKeyDown, false)
    window.addEventListener('keyup', this.onKeyUp, false)
    window.addEventListener('contextmenu', this.onMouseUp, false)

    this.fit()
  }

  this.start = function () {
    this.fit()
    this.fill()
    cursor.mode = this.trace
  }

  this.fit = function (size = { w: window.innerWidth, h: window.innerHeight }) {
    this.el.width = size.w
    this.el.height = size.h
    this.el.style.width = size.w + 'px'
    this.el.style.height = size.h + 'px'
  }

  this.fill = (color = 'white') => {
    this.context.save()
    this.context.fillStyle = color
    this.context.fillRect(0, 0, window.innerWidth, window.innerHeight)
    this.context.restore()
  }

  this.invert = () => {
    this.context.save()
    this.context.drawImage(this.el, 0, 0)
    this.context.globalCompositeOperation = 'difference'
    this.context.fillStyle = 'white'
    this.context.fillRect(0, 0, window.innerWidth, window.innerHeight)
    this.context.restore()
  }

  this.flip = () => {
    this.context.save()
    this.context.translate(window.innerWidth, 0)
    this.context.scale(-1, 1)
    this.context.drawImage(this.el, 0, 0)
    this.context.restore()
  }

  // Modes

  this.trace = (a, b) => {
    const dx = Math.abs(b.x - a.x)
    const dy = -Math.abs(b.y - a.y)
    let err = dx + dy; let e2
    for (;;) {
      this.context.fillRect(a.x, a.y, 1, 1)
      if (a.x === b.x && a.y === b.y) { break }
      e2 = 2 * err
      if (e2 >= dy) { err += dy; a.x += (a.x < b.x ? 1 : -1) }
      if (e2 <= dx) { err += dx; a.y += (a.y < b.y ? 1 : -1) }
    }
  }

  this.drag = (a, b) => {
    const imageData = this.context.getImageData(0, 0, this.context.canvas.width, this.context.canvas.height)
    this.context.putImageData(imageData, Math.floor((b.x - a.x) / 3) * 3, Math.floor((b.y - a.y) / 3) * 3)
    cursor.a.x = b.x
    cursor.a.y = b.y
  }

  this.tone = (a, b) => {
    for (let x = 0; x <= cursor.size; x++) {
      for (let y = 0; y <= cursor.size; y++) {
        const pos = { x: b.x + x - Math.floor(cursor.size / 2), y: b.y + y - Math.floor(cursor.size / 2) }
        if (pos.x % 3 === 0 && pos.y % 3 === 0) {
          this.context.fillRect(pos.x, pos.y, 1, 1)
        }
      }
    }
  }

  // Events

  this.onMouseDown = (e) => {
    cursor.z = 1
    cursor.a.x = e.clientX
    cursor.a.y = e.clientY
    cursor.mode(cursor.a, cursor.a)
    e.preventDefault()
  }

  this.onMouseMove = (e) => {
    if (cursor.z !== 1) { return }
    cursor.b.x = e.clientX
    cursor.b.y = e.clientY
    cursor.mode(cursor.a, cursor.b)
    e.preventDefault()
  }

  this.onMouseUp = (e) => {
    cursor.z = 0
    cursor.b.x = e.clientX
    cursor.b.y = e.clientY
    cursor.mode(cursor.a, cursor.b)
    e.preventDefault()
  }

  this.onKeyDown = (e) => {
    if (e.key === 'Shift') {
      cursor.color = 'white'
    } else if (e.key === 'Alt') {
      cursor.mode = this.drag
    } else if (e.key === 'Control' || e.key === 'Meta') {
      cursor.mode = this.tone
    } else if (e.key === '1') {
      cursor.mode = this.trace
    } else if (e.key === '2') {
      cursor.mode = this.tone
    } else if (e.key === '3') {
      cursor.mode = this.erase
    } else if (e.key === 'i') {
      this.invert()
    } else if (e.key === 'x') {
      this.flip()
    } else if (e.key === '[' && cursor.size > 0) {
      cursor.size -= 1
    } else if (e.key === ']' && cursor.size < 100) {
      cursor.size += 1
    }
    this.context.fillStyle = cursor.color
  }

  this.onKeyUp = (e) => {
    if (e.key === 'Shift') {
      cursor.color = 'black'
    } else if (e.key === 'Alt' || e.key === 'Control' || e.key === 'Meta') {
      cursor.mode = this.trace
    } else if (e.key === 'Escape') {
      this.fill()
    } else if (e.key === 's') {
      grab(this.el.toDataURL('image/png'))
    }
    this.context.fillStyle = cursor.color
  }

  window.addEventListener('paste', async (e) => {
    e.preventDefault()
    e.stopPropagation()
    for (const item of e.clipboardData.items) {
      if (item.type.indexOf('image') < 0) { continue }
      const img = new Image()
      img.onload = () => {
        this.context.drawImage(img, 0, 0)
      }
      img.src = URL.createObjectURL(item.getAsFile())
    }
  })

  function grab (base64, name = 'export.png') {
    const link = document.createElement('a')
    link.setAttribute('href', base64)
    link.setAttribute('download', name)
    link.dispatchEvent(new MouseEvent(`click`, { bubbles: true, cancelable: true, view: window }))
  }
}
