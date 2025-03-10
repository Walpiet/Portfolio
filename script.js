document.addEventListener('DOMContentLoaded', function () {
  const folders = document.querySelectorAll('.icon-folder');
  const desktop = document.querySelector('.desktop');
  const desktopWidth = window.innerWidth;
  const desktopHeight = window.innerHeight;
  
  // Haal watermark op voor collision-check
  const watermarkEl = document.querySelector('.watermark');
  const watermarkRect = watermarkEl ? watermarkEl.getBoundingClientRect() : null;
  // Stel een virtuele taskbar in (onderste 50px) om overlap te voorkomen
  const virtualTaskbarRect = { left: 0, top: desktopHeight - 50, right: desktopWidth, bottom: desktopHeight };
  
  // Functie om alle mappen te deselecteren
  function clearSelection() {
    folders.forEach(folder => folder.classList.remove('selected'));
  }
  
  /* --- Folder events --- */
  folders.forEach(folder => {
    // Als de folder vast is EN niet Project 5, toon alert
    if (folder.classList.contains('fixed') && folder.getAttribute('data-project') !== 'project5') {
      folder.addEventListener('click', function(e) {
        alert("Deze functie heb ik niet geprogrammeerd");
        e.stopPropagation();
      });
    } else {
      // Voor niet-vaste folders EN vaste folder "project5": standaard functionaliteit
      folder.addEventListener('click', function(e) {
        if (folder.dragging) {
          folder.dragging = false;
          return;
        }
        clearSelection();
        folder.classList.add('selected');
        e.stopPropagation();
      });
      folder.addEventListener('dblclick', function(e) {
        const project = folder.getAttribute('data-project');
        openModal(project + '.html');
        e.stopPropagation();
      });
    }
  });
  
  /* --- Drag & Drop functionaliteit --- */
  let currentDrag = null, offsetX = 0, offsetY = 0, initialX = 0, initialY = 0;
  folders.forEach(folder => {
    folder.addEventListener('mousedown', function(e) {
      currentDrag = folder;
      folder.dragging = false;
      initialX = e.clientX;
      initialY = e.clientY;
      const rect = folder.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      folder.style.zIndex = 1000;
      e.stopPropagation();
      e.preventDefault();
    });
  });
  document.addEventListener('mousemove', function(e) {
    if (currentDrag) {
      const dx = e.clientX - initialX;
      const dy = e.clientY - initialY;
      if (!currentDrag.dragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        currentDrag.dragging = true;
        currentDrag.classList.add('dragging');
      }
      if (currentDrag.dragging) {
        currentDrag.style.left = (e.clientX - offsetX) + 'px';
        currentDrag.style.top = (e.clientY - offsetY) + 'px';
      }
    }
    // Lasso-selectie (selectiebox)
    if (selectionBox) {
      const currentX = e.clientX;
      const currentY = e.clientY;
      const x = Math.min(currentX, selectionStartX);
      const y = Math.min(currentY, selectionStartY);
      const width = Math.abs(currentX - selectionStartX);
      const height = Math.abs(currentY - selectionStartY);
      selectionBox.style.left = x + 'px';
      selectionBox.style.top = y + 'px';
      selectionBox.style.width = width + 'px';
      selectionBox.style.height = height + 'px';
      const selectionRect = selectionBox.getBoundingClientRect();
      folders.forEach(folder => {
        const folderRect = folder.getBoundingClientRect();
        if (rectIntersect(selectionRect, folderRect)) {
          folder.classList.add('selected');
        } else {
          folder.classList.remove('selected');
        }
      });
    }
  });
  document.addEventListener('mouseup', function(e) {
    if (currentDrag) {
      currentDrag.classList.remove('dragging');
      currentDrag.style.zIndex = '';
      currentDrag = null;
    }
    if (selectionBox) {
      const rect = selectionBox.getBoundingClientRect();
      if (rect.width < 5 && rect.height < 5) {
        clearSelection();
      }
      if (desktop.contains(selectionBox)) {
        desktop.removeChild(selectionBox);
      }
      selectionBox = null;
    }
  });
  
  /* --- Lasso (selectiebox) functionaliteit --- */
  let selectionBox = null, selectionStartX = 0, selectionStartY = 0;
  desktop.addEventListener('mousedown', function(e) {
    if (!e.target.closest('.icon-folder')) {
      clearSelection();
      selectionStartX = e.clientX;
      selectionStartY = e.clientY;
      selectionBox = document.createElement('div');
      selectionBox.id = 'selection-box';
      selectionBox.style.left = selectionStartX + 'px';
      selectionBox.style.top = selectionStartY + 'px';
      desktop.appendChild(selectionBox);
    }
  });
  function rectIntersect(r1, r2) {
    return !(r2.left > r1.right ||
             r2.right < r1.left ||
             r2.top > r1.bottom ||
             r2.bottom < r1.top);
  }
  
  /* --- Random spawn positie voor niet-vaste mappen, zonder overlap en buiten virtuele taskbar en watermark --- */
  const nonFixedFolders = Array.from(folders).filter(folder => !folder.classList.contains('fixed'));
  const placedRects = [];
  
  nonFixedFolders.forEach(folder => {
    const iconWidth = folder.offsetWidth;
    const iconHeight = folder.offsetHeight;
    const maxX = desktopWidth - iconWidth;
    const maxY = desktopHeight - iconHeight;
    let attempts = 0;
    let placed = false;
    let left, top, newRect;
    
    while (!placed && attempts < 100) {
      left = Math.random() * maxX;
      top = Math.random() * (maxY - 50); // Houd minimaal 50px boven de onderkant (virtuele taskbar)
      newRect = {
        left: left,
        top: top,
        right: left + iconWidth,
        bottom: top + iconHeight
      };
  
      let collision = false;
      for (let rect of placedRects) {
        if (rectIntersect(newRect, rect)) {
          collision = true;
          break;
        }
      }
      if (!collision && rectIntersect(newRect, virtualTaskbarRect)) {
        collision = true;
      }
      if (!collision && watermarkRect && rectIntersect(newRect, watermarkRect)) {
        collision = true;
      }
  
      if (!collision) {
        placed = true;
        placedRects.push(newRect);
        folder.style.left = left + 'px';
        folder.style.top = top + 'px';
      }
      attempts++;
    }
    if (!placed) {
      folder.style.left = left + 'px';
      folder.style.top = top + 'px';
      placedRects.push(newRect);
    }
  });
  
  /* --- Modal Window functionaliteit voor projectpagina's --- */
  function openModal(url) {
    const modalWindow = document.getElementById('modal-window');
    const iframe = document.getElementById('modal-iframe');
    iframe.src = url;
    modalWindow.style.display = 'flex';
  }
  
  // Sluit de modal wanneer op het kruisje of buiten de modal wordt geklikt
  document.querySelector('.close-modal').addEventListener('click', function() {
    document.getElementById('modal-window').style.display = 'none';
  });
  document.getElementById('modal-window').addEventListener('click', function(e) {
    if (e.target === this) {
      this.style.display = 'none';
    }
  });
});
