document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const bookForm = document.getElementById('book-form');
    const bookList = document.getElementById('book-list');
    const searchInput = document.getElementById('search');
    const noBooksMessage = document.getElementById('no-books');
    const nav = document.querySelector('.nav');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const cartCount = document.getElementById('cart-count');
    const categoryChips = document.querySelectorAll('.category-chip');
    const toastContainer = document.getElementById('toast-container');
    const body = document.body;

    // Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // State
    let books = JSON.parse(localStorage.getItem('books')) || [];
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    // Default to dark mode for premium feel if not set
    let darkMode = localStorage.getItem('darkMode') !== 'false';
    let currentCategory = 'all';

    // Helper: Generate ID
    const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

    // Initial Setup
    if (darkMode) {
        body.classList.remove('light-mode');
    } else {
        body.classList.add('light-mode');
    }
    updateThemeIcon();
    updateCartCount();

    // Initial Seed Data (if empty)
    if (books.length === 0) {
        const seedBooks = [
            { id: generateId(), title: "The Great Gatsby", author: "F. Scott Fitzgerald", price: 12.99, category: "Fiction", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800" },
            { id: generateId(), title: "Atomic Habits", author: "James Clear", price: 24.50, category: "non-fiction", image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800" },
            { id: generateId(), title: "The Alchemist", author: "Paulo Coelho", price: 15.00, category: "Fiction", image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800" },
            { id: generateId(), title: "Steve Jobs", author: "Walter Isaacson", price: 18.99, category: "biography", image: "https://images.unsplash.com/photo-1531297461136-82lwDe43?auto=format&fit=crop&q=80&w=800" },
            { id: generateId(), title: "Dune", author: "Frank Herbert", price: 14.99, category: "sci-fi", image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800" }
        ];
        books = seedBooks;
        saveBooks();
    }

    // Functions
    function saveBooks() {
        localStorage.setItem('books', JSON.stringify(books));
        renderBooks();
    }

    function renderBooks() {
        bookList.innerHTML = '';

        let filteredBooks = books;

        // Filter by Search
        const searchTerm = searchInput.value.toLowerCase();
        filteredBooks = filteredBooks.filter(book =>
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm)
        );

        // Filter by Category
        if (currentCategory !== 'all') {
            filteredBooks = filteredBooks.filter(book => book.category && book.category.toLowerCase() === currentCategory.toLowerCase());
        }

        if (filteredBooks.length === 0) {
            noBooksMessage.classList.remove('hidden');
        } else {
            noBooksMessage.classList.add('hidden');

            filteredBooks.forEach(book => {
                const card = document.createElement('div');
                card.classList.add('book-card');

                const imageUrl = book.image || 'https://via.placeholder.com/300x400?text=No+Cover';
                const category = book.category || 'Uncategorized';

                card.innerHTML = `
                    <div class="book-tag">${category}</div>
                    <img src="${imageUrl}" alt="${book.title}" class="book-cover">
                    <div class="book-content">
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">by ${book.author}</p>
                        <div class="book-actions">
                            <div class="book-price-row">
                                <span class="book-price">$${parseFloat(book.price).toFixed(2)}</span>
                            </div>
                            <div class="book-buttons">
                                <button class="add-cart-btn" data-id="${book.id}">Add to Cart</button>
                                <button class="btn btn-danger delete-btn" data-id="${book.id}">Delete</button>
                            </div>
                        </div>
                    </div>
                `;
                bookList.appendChild(card);
            });
        }
    }

    function addBook(e) {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const author = document.getElementById('author').value;
        const price = document.getElementById('price').value;
        const category = document.getElementById('category').value;
        const image = document.getElementById('image').value;

        const newBook = {
            id: generateId(),
            title,
            author,
            price,
            category,
            image: image || `https://source.unsplash.com/random/300x400/?book,${encodeURIComponent(title)}`
        };

        books.push(newBook);
        saveBooks();
        bookForm.reset();
        showToast(`"${title}" added to collection!`, 'success');

        window.scrollTo({
            top: document.getElementById('books').offsetTop - 100,
            behavior: 'smooth'
        });

        renderBooks();
    }

    function deleteBook(id) {
        if (confirm('Are you sure you want to remove this title from the collection?')) {
            const book = books.find(b => b.id === id);
            books = books.filter(book => book.id !== id);
            saveBooks();
            showToast(`"${book.title}" removed.`, 'danger');
        }
    }

    const cartOverlay = document.getElementById('cart-overlay');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const cartBtn = document.getElementById('cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Cart Functions
    function toggleCart() {
        cartOverlay.classList.toggle('open');
        cartSidebar.classList.toggle('open');
        if (cartSidebar.classList.contains('open')) {
            renderCartItems();
        }
    }

    function addToCart(id) {
        const book = books.find(b => b.id === id);
        if (!book) return;

        cart.push(book);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showToast(`Added "${book.title}" to collection`, 'success');

        // Optional: Auto open cart on add
        // toggleCart(); 
        if (cartSidebar.classList.contains('open')) {
            renderCartItems();
        }
    }

    function removeFromCart(index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCartItems();
    }

    function renderCartItems() {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-msg">
                    <p>Your collection is empty.</p>
                </div>`;
            cartTotalAmount.innerText = '$0.00';
            return;
        }

        cartItemsContainer.innerHTML = '';
        let total = 0;

        cart.forEach((book, index) => {
            const price = parseFloat(book.price);
            total += price;

            const itemEl = document.createElement('div');
            itemEl.classList.add('cart-item');
            itemEl.innerHTML = `
                <img src="${book.image || 'https://via.placeholder.com/70x90'}" alt="${book.title}">
                <div class="cart-item-details">
                    <h4>${book.title}</h4>
                    <p>${book.author}</p>
                    <div class="book-price-row" style="justify-content: space-between; display: flex; align-items: center;">
                        <span class="cart-item-price">$${price.toFixed(2)}</span>
                        <button class="remove-item-btn" data-index="${index}">Remove</button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(itemEl);
        });

        cartTotalAmount.innerText = '$' + total.toFixed(2);

        // Attach listeners to new remove buttons
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                removeFromCart(parseInt(e.target.dataset.index));
            });
        });
    }

    function updateCartCount() {
        cartCount.textContent = cart.length;
        if (cart.length > 0) {
            cartCount.classList.remove('hidden');
        } else {
            cartCount.classList.add('hidden');
        }
    }

    // Cart Event Listeners
    cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleCart();
    });

    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showToast('Your cart is empty!', 'default');
                return;
            }

            // Simulate Processing
            const originalText = checkoutBtn.innerText;
            checkoutBtn.innerText = 'Processing...';
            checkoutBtn.disabled = true;
            checkoutBtn.style.opacity = '0.7';

            setTimeout(() => {
                cart = [];
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                renderCartItems();

                checkoutBtn.innerText = originalText;
                checkoutBtn.disabled = false;
                checkoutBtn.style.opacity = '1';

                toggleCart(); // Close drawer

                // Show celebration toast
                showToast('Order confirmed! Thank you for your patronage.', 'success');
            }, 1500); // 1.5s delay for effect
        });
    }

    // Theme Toggle
    function toggleTheme() {
        darkMode = !darkMode;
        if (darkMode) {
            body.classList.remove('light-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            body.classList.add('light-mode');
            localStorage.setItem('darkMode', 'false');
        }
        updateThemeIcon();
    }

    function updateThemeIcon() {
        const moon = themeToggle.querySelector('.moon-icon');
        const sun = themeToggle.querySelector('.sun-icon');
        // Logic inverted compared to old because default is dark
        if (darkMode) {
            moon.classList.add('hidden');
            sun.classList.remove('hidden');
        } else {
            moon.classList.remove('hidden');
            sun.classList.add('hidden');
        }
    }

    // Toast Notification
    function showToast(message, type = 'default') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Trigger reflow
        void toast.offsetWidth;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // Category Filter
    categoryChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Remove active class from all
            categoryChips.forEach(c => c.classList.remove('active'));
            // Add to clicked
            chip.classList.add('active');

            currentCategory = chip.dataset.category;
            renderBooks();
        });
    });

    // Event Listeners
    bookForm.addEventListener('submit', addBook);
    searchInput.addEventListener('input', renderBooks);
    themeToggle.addEventListener('click', toggleTheme);

    bookList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.getAttribute('data-id');
            deleteBook(id);
        } else if (e.target.classList.contains('add-cart-btn')) {
            const id = e.target.getAttribute('data-id');
            addToCart(id);
        }
    });

    // Mobile Menu
    mobileBtn.addEventListener('click', () => {
        nav.classList.toggle('open');
    });

    // Contact Form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contact-name').value;

            // Simulate form submission
            setTimeout(() => {
                showToast(`Thank you ${name}. We will be in touch shortly.`, 'success');
                contactForm.reset();
            }, 500);
        });
    }

    // Custom Cursor Logic
    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');

    if (cursorDot && cursorOutline) {
        window.addEventListener('mousemove', function (e) {
            const posX = e.clientX;
            const posY = e.clientY;

            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            // Smooth follow
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        // Cursor Hover Effects
        const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, .book-card');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.style.width = '60px';
                cursorOutline.style.height = '60px';
                cursorOutline.style.backgroundColor = 'rgba(212, 175, 55, 0.1)';
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.style.width = '40px';
                cursorOutline.style.height = '40px';
                cursorOutline.style.backgroundColor = 'transparent';
            });
        });
    }

    // 3D Tilt Effect for Book Cards
    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.book-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Check if mouse is near/over the card
            if (x >= -50 && x <= rect.width + 50 && y >= -50 && y <= rect.height + 50) {
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg rotation
                const rotateY = ((x - centerX) / centerX) * 10;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            } else {
                card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
            }
        });
    });

    // Initial Render
    renderBooks();
});
