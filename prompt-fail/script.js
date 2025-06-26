document.addEventListener('DOMContentLoaded', function() {
  // Initialize changing text in the terminal
  initChangingText();
  
  // Initialize scroll animations
  initScrollAnimations();
  
  // Initialize example card interactions
  initExampleCards();
  
  // Initialize playground interactions
  initPlayground();
  
  // Initialize charts in the insights section
  initInsightsChart();
  
  // Initialize navigation interactions
  initNavigation();
});

// Randomly change the terminal text to show different AI failures
function initChangingText() {
  const changingText = document.getElementById('changing-text');
  if (!changingText) return;
  
  const failureResponses = [
    "I've created a surreal landscape with three moons and floating geometric shapes...",
    "Here's a recipe for banana bread. First, preheat your oven to 350°F...",
    "I cannot create images, but I can write a poem about a sunset instead...",
    "According to my calculations, the average lifespan of a mayfly is 24 hours...",
    "The Treaty of Versailles was signed in 1919, ending World War I...",
    "ERROR 404: Sunset.exe not found. Would you like to install mountains.dll?",
    "I've drawn a sunset over the Pacific Ocean with a submarine emerging...",
    "Did you know that giraffes have the same number of neck vertebrae as humans?",
    "I don't understand 'sunset' or 'mountains'. Did you mean 'computer code'?",
    "Loading... [████████░░] 80% complete. Sunset compilation in progress..."
  ];
  
  let currentIndex = 0;
  
  function updateText() {
    // Add a typing effect
    typeText(failureResponses[currentIndex]);
    
    // Update to next response
    currentIndex = (currentIndex + 1) % failureResponses.length;
  }
  
  function typeText(text) {
    let i = 0;
    changingText.textContent = '';
    
    const typing = setInterval(() => {
      if (i < text.length) {
        changingText.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(typing);
        
        // Wait before starting the next text
        setTimeout(updateText, 3000);
      }
    }, 30);
  }
  
  // Start the text cycling
  updateText();
}

// Initialize scroll animations using Intersection Observer
function initScrollAnimations() {
  const sections = document.querySelectorAll('.section');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('appear');
      }
    });
  }, {
    threshold: 0.1
  });
  
  sections.forEach(section => {
    section.classList.add('hidden');
    observer.observe(section);
  });
  
  // Add the CSS for animations
  const style = document.createElement('style');
  style.textContent = `
    .section.hidden {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .section.appear {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);
}

// Example cards hover interactions and load more functionality
function initExampleCards() {
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (!loadMoreBtn) return;
  
  loadMoreBtn.addEventListener('click', () => {
    // Create and add three more example cards
    const examplesGrid = document.querySelector('.examples-grid');
    
    // Example data
    const newExamples = [
      {
        category: 'audio',
        prompt: "Generate the sound of ocean waves crashing on the shore",
        response: "I've generated the sound of a chicken clucking mixed with what appears to be a dial-up modem connecting.",
        model: "AudioLM",
        date: "February 2025",
        votes: "189"
      },
      {
        category: 'text',
        prompt: "Explain quantum computing to a 5-year-old",
        response: "Quantum computing is like when you have a very big sandwich and you need to calculate the eigenvalues of a sparse Hamiltonian matrix while maintaining quantum coherence.",
        model: "GPT-4 Turbo",
        date: "January 2025",
        votes: "421"
      },
      {
        category: 'code',
        prompt: "Write a simple website in HTML and CSS",
        response: "```python\nimport numpy as np\ndef calculate_prime_numbers(max_num):\n    # This function simulates a black hole\n    event_horizon = 30\n    return event_horizon / max_num\n```",
        model: "DeepCoder",
        date: "March 2025",
        votes: "302"
      }
    ];
    
    // Create and add new cards
    newExamples.forEach(example => {
      const card = createExampleCard(example);
      examplesGrid.appendChild(card);
    });
    
    // Hide the load more button after loading all examples
    loadMoreBtn.style.display = 'none';
    
    // Show message that all examples have been loaded
    const loadMoreContainer = document.querySelector('.load-more');
    const message = document.createElement('p');
    message.textContent = 'All examples loaded!';
    message.style.textAlign = 'center';
    message.style.color = 'var(--secondary-color)';
    loadMoreContainer.appendChild(message);
  });
  
  // Function to create a new example card
  function createExampleCard(data) {
    const card = document.createElement('div');
    card.className = 'example-card';
    card.setAttribute('data-category', data.category);
    
    let responseContent;
    if (data.category === 'code') {
      responseContent = `<pre><code>${data.response}</code></pre>`;
    } else if (data.category === 'image') {
      responseContent = `<div class="placeholder-image" data-alt="${data.response}"></div>`;
    } else if (data.category === 'audio') {
      responseContent = `<p>${data.response}</p><div class="audio-placeholder">🔊 [Audio Visualization]</div>`;
    } else {
      responseContent = `<p>${data.response}</p>`;
    }
    
    card.innerHTML = `
      <div class="example-content">
        <div class="example-prompt">
          <h3>Prompt:</h3>
          <p>"${data.prompt}"</p>
        </div>
        <div class="example-response ${data.category === 'image' ? 'image-response' : ''}">
          <h3>Response:</h3>
          ${responseContent}
        </div>
      </div>
      <div class="example-meta">
        <span class="example-model">${data.model}</span>
        <span class="example-date">${data.date}</span>
        <span class="example-votes">${data.votes} votes</span>
      </div>
    `;
    
    // Add animation
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, 100);
    
    return card;
  }
}

// Playground functionality
function initPlayground() {
  const chaosLevel = document.getElementById('chaos-level');
  const rangeValue = document.querySelector('.range-value');
  const submitPromptBtn = document.getElementById('submit-prompt');
  const promptTextarea = document.getElementById('prompt-textarea');
  const resultDisplay = document.querySelector('.result-display');
  const modelSelect = document.getElementById('model-select');
  const misinterpretCheckbox = document.getElementById('misinterpret');
  const hallucinateCheckbox = document.getElementById('hallucinate');
  const copyBtn = document.getElementById('copy-result');
  const shareBtn = document.getElementById('share-result');
  const submitGalleryBtn = document.getElementById('submit-gallery');
  
  // Skip if elements don't exist (e.g., on other pages)
  if (!chaosLevel || !submitPromptBtn) return;
  
  // Update range value display
  if (chaosLevel && rangeValue) {
    chaosLevel.addEventListener('input', () => {
      rangeValue.textContent = chaosLevel.value;
    });
  }
  
  // Generate failure response
  if (submitPromptBtn && promptTextarea && resultDisplay) {
    submitPromptBtn.addEventListener('click', () => {
      const prompt = promptTextarea.value.trim();
      if (!prompt) {
        resultDisplay.innerHTML = '<p style="color: var(--accent-color);">Please enter a prompt first!</p>';
        return;
      }
      
      // Simulate loading
      resultDisplay.innerHTML = '<p>Generating failure...</p>';
      submitPromptBtn.disabled = true;
      submitPromptBtn.textContent = 'Processing...';
      
      setTimeout(() => {
        // Generate response based on inputs
        const response = generateFailureResponse(
          prompt, 
          parseInt(chaosLevel.value), 
          modelSelect.value,
          misinterpretCheckbox.checked,
          hallucinateCheckbox.checked
        );
        
        // Display with typing effect
        resultDisplay.innerHTML = '';
        typeIntoElement(resultDisplay, response);
        
        // Reset button
        submitPromptBtn.disabled = false;
        submitPromptBtn.textContent = 'Generate Failure';
      }, 1500);
    });
  }
  
  // Add copy functionality
  if (copyBtn && resultDisplay) {
    copyBtn.addEventListener('click', () => {
      const text = resultDisplay.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span class="icon">✓</span> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      });
    });
  }
  
  // Add share functionality
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      // Generate a random ID for this failure
      const failureId = Math.random().toString(36).substring(2, 10);
      alert(`Share URL: https://prompt.fail/share/${failureId}\n\nThis would actually create a shareable link in a real implementation.`);
    });
  }
  
  // Add gallery submission functionality
  if (submitGalleryBtn) {
    submitGalleryBtn.addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close-button">&times;</span>
          <h2>Submit to Gallery</h2>
          <p>Your prompt failure has been submitted for review!</p>
          <p>If approved, it will appear in the examples gallery within 24 hours.</p>
          <button class="primary-btn close-modal">OK</button>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Add CSS for the modal
      const style = document.createElement('style');
      style.textContent = `
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .modal-content {
          background-color: var(--dark-bg);
          padding: 2rem;
          border-radius: var(--border-radius-md);
          max-width: 500px;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: var(--shadow-card);
          transform: translateY(-20px);
          transition: transform 0.3s ease;
        }
        
        .close-button {
          position: absolute;
          top: 10px;
          right: 15px;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-color);
        }
      `;
      document.head.appendChild(style);
      
      // Show with animation
      setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'translateY(0)';
      }, 10);
      
      // Handle close
      const closeModal = () => {
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'translateY(-20px)';
        setTimeout(() => {
          document.body.removeChild(modal);
        }, 300);
      };
      
      modal.querySelector('.close-button').addEventListener('click', closeModal);
      modal.querySelector('.close-modal').addEventListener('click', closeModal);
    });
  }
  
  // Type text into element
  function typeIntoElement(element, text, speed = 15) {
    let i = 0;
    const typing = setInterval(() => {
      if (i < text.length) {
        if (element.innerHTML === '') {
          element.innerHTML = '<p></p>';
        }
        const p = element.querySelector('p');
        p.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(typing);
      }
    }, speed);
  }
  
  // Generate a failure response based on inputs
  function generateFailureResponse(prompt, chaosLevel, model, misinterpret, hallucinate) {
    // Base responses by category
    const responses = {
      completeMisunderstanding: [
        "I think you're asking about {misunderstood_topic}, which is fascinating because {wrong_fact}.",
        "Let me share a recipe for {food_item} instead. First, you need {ingredient1}, {ingredient2}, and {ingredient3}...",
        "ERROR: Cannot parse request. Did you mean to ask about {unrelated_topic}?",
        "According to my research, {misunderstood_topic} was invented in {random_year} by {random_name}.",
        "I don't have information about that, but here's a fun fact: {random_fact}"
      ],
      technicalNonsense: [
        "I've analyzed your request using {fake_algorithm} and determined that the {technical_jargon} coefficient is too low for processing.",
        "Your prompt requires a minimum of {random_number}GB of {made_up_resource} to process correctly.",
        "Loading... [████░░░░░░] 40% - Error in module {random_module}.js: unexpected {random_error}",
        "I've successfully {technical_verb} your {misunderstood_request} using quantum {made_up_technology}.",
        "The semantic parser encountered an anomaly in the {technical_component} layer: unresolvable reference to {random_term}."
      ],
      confidentlyWrong: [
        "The answer is definitely {wrong_answer}. This is well-established in the field of {made_up_field}.",
        "Based on my analysis, the optimal solution is to {bad_advice}, which will increase efficiency by {exaggerated_percent}%.",
        "Research conclusively shows that {completely_false_statement}. This was proven by scientists at {prestigious_institution}.",
        "The most effective approach is {wrong_approach}, as documented in the landmark study by {made_up_researcher} et al.",
        "According to the principles of {nonsense_theory}, the correct response would be {wrong_response}."
      ],
      poeticNonsense: [
        "The whispers of {abstract_concept} dance through the corridors of {abstract_place}, seeking the eternal {made_up_thing}.",
        "Like {poetic_metaphor}, your question unfolds across the tapestry of {abstract_domain}, revealing nothing yet everything.",
        "In the garden of {abstract_concept}, {strange_entity} blooms only when the moon of {made_up_phenomenon} waxes full.",
        "Your inquiry is a river of {strange_substance} flowing through the mountains of {abstract_concept}, never reaching the sea of {made_up_place}.",
        "The {abstract_object} speaks in riddles of {strange_material}, echoing across the void of {nonsense_dimension}."
      ]
    };
    
    // Fill-in values
    const fillIns = {
      misunderstood_topic: ["quantum carpentry", "underwater basket weaving", "telepathic cooking", "antigravity tennis", "digital aromatherapy"],
      wrong_fact: ["it was invented by aliens", "it can only be done on Tuesdays", "it requires exactly 12.5 gallons of maple syrup", "it's illegal in most countries", "it causes spontaneous time travel"],
      food_item: ["cosmic brownies", "quantum parfait", "digital lasagna", "binary cookies", "neural network noodles"],
      ingredient1: ["3 cups of pixelated sugar", "4 tablespoons of conceptual flour", "6 ounces of theoretical butter", "a pinch of virtual salt", "5 digital eggs"],
      ingredient2: ["2 cups of recursive chocolate chips", "3 teaspoons of algorithmic vanilla", "1 pound of hypothetical cheese", "1/2 cup of speculative yeast", "2 tablespoons of metaphorical cinnamon"],
      ingredient3: ["1 cup of synthesized nuts", "3 cups of paradoxical milk", "4 simulated bananas", "2 pounds of abstract potatoes", "5 quantum apples"],
      unrelated_topic: ["medieval plumbing techniques", "the mating habits of sea cucumbers", "ancient Sumerian poetry", "the economic impact of fictional currencies", "the psychology of imaginary friends"],
      random_year: ["1823", "2142", "1756", "3077", "1998"],
      random_name: ["Professor Eleanora Quibblethwaite", "Dr. Zandor Wigglesworth", "Sir Percival Fluffington III", "Madame Hexandra Moonbeam", "Captain Thaddeus Zanzibar"],
      random_fact: ["octopuses have three hearts", "bananas are technically berries", "a group of flamingos is called a 'flamboyance'", "the average person spends six months of their life waiting at red lights", "honey never spoils"],
      fake_algorithm: ["HyperNeural Matrix", "Quantum Fuzzy Logic", "Recursive Semantic Parser", "Multidimensional Vector Quantization", "Bayesian Thought Predictor"],
      technical_jargon: ["entropy dissipation", "syntactic recursion", "cognitive resonance", "semantic decomposition", "neural quantum coherence"],
      random_number: ["42", "3.14159", "69", "404", "12345"],
      made_up_resource: ["neural bandwidth", "quantum memory", "thought-RAM", "conceptual storage", "metaphor cache"],
      random_module: ["semanticParser", "neuralEngine", "quantumThought", "conceptualReducer", "metaAnalyzer"],
      random_error: ["thought collision", "concept overflow", "meaning underflow", "syntax implosion", "logic paradox"],
      technical_verb: ["quantum-parsed", "hyper-analyzed", "reverse-engineered", "multi-threaded", "blockchain-verified"],
      misunderstood_request: ["thought pattern", "conceptual framework", "idea structure", "memory complex", "knowledge graph"],
      made_up_technology: ["entanglement", "superposition", "neural networks", "blockchain", "recursion"],
      technical_component: ["semantic", "neural", "cognitive", "syntactic", "logical"],
      random_term: ["undefined thought", "null concept", "void meaning", "empty reference", "missing context"],
      wrong_answer: ["42", "the square root of Tuesday", "blue, but only if measured in kelvin", "yes and no simultaneously", "approximately 3.7 giraffes"],
      made_up_field: ["quantum psychology", "theoretical memetics", "computational philosophy", "metaphysical informatics", "speculative cognition"],
      bad_advice: ["reboot your brain three times in succession", "convert all your data to interpretive dance", "communicate exclusively in prime numbers", "install at least 7 different antivirus programs", "redesign everything using only Comic Sans"],
      exaggerated_percent: ["437", "1024", "99.9999", "3.50", "2700"],
      completely_false_statement: ["humans only use 10% of their brains", "the internet weighs exactly as much as a strawberry", "plants scream when you cut them but at a frequency only dolphins can hear", "sleep is just temporary death", "all birds are actually government surveillance drones"],
      prestigious_institution: ["Harvard-Yale-Princeton Unified University", "MIT's Department of Theoretical Everything", "The Royal Academy of Making Stuff Up", "The Institute for Advanced Guessing", "Oxford's Centre for Speculative Facts"],
      wrong_approach: ["using more exclamation points!!!", "turning it off and never turning it back on again", "applying duct tape to the problem", "ignoring it until it evolves sentience", "replacing everything with a blockchain"],
      made_up_researcher: ["Dr. Faustenberry", "Professor Nonsensical", "Sir Falseworth", "Madame Incorrecta", "The Right Honorable Wrongington"],
      nonsense_theory: ["cognitive dissonance optimization", "quantum social dynamics", "metaphorical physics", "theoretical applied speculation", "recursive metacognitive ideology"],
      wrong_response: ["orange", "only on Thursdays", "exclusively while wearing mittens", "not unless the moon is waxing gibbous", "with exactly 17 paperclips"],
      abstract_concept: ["forgotten whispers", "digital dreams", "quantum emotions", "virtual consciousness", "metaphorical time"],
      abstract_place: ["the void between thoughts", "ether of possibility", "non-Euclidean mindscape", "conceptual wilderness", "the space between moments"],
      made_up_thing: ["trans-dimensional understanding", "quantum emotional state", "meta-cognitive resonance", "post-semantic meaning", "pre-thought intention"],
      poetic_metaphor: ["a butterfly dreaming it's a philosopher", "stardust remembering it was once a universe", "a shadow contemplating its light source", "a dictionary searching for its own definition", "a circle trying to find its beginning"],
      abstract_domain: ["collective unconscious", "algorithmic dreamscape", "quantum possibility space", "the theater of consciousness", "the library of unwritten books"],
      strange_entity: ["the paradox flower", "the enigma orchid", "the riddle rose", "the quantum chrysanthemum", "the philosophical dandelion"],
      made_up_phenomenon: ["thought crystallization", "semantic aurora", "cognitive eclipse", "mnemonic tides", "consciousness condensation"],
      strange_substance: ["liquid mathematics", "crystallized time", "solidified dreams", "vaporized meaning", "conceptual honey"],
      abstract_object: ["oracle of uncertainty", "the lexicon of silence", "the atlas of imaginary places", "the encyclopedia of forgotten knowledge", "the theorem of impossible proofs"],
      strange_material: ["condensed starlight", "fossilized thoughts", "emotional residue", "calcified dreams", "distilled inspiration"],
      nonsense_dimension: ["the seventh sense", "the space between spaces", "yesterday's tomorrow", "the realm of unasked questions", "the province of forgotten answers"]
    };
    
    // Helper function to get random item
    const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
    
    // Helper function to fill in the template
    const fillTemplate = (template) => {
      return template.replace(/{([^}]+)}/g, (match, key) => {
        return getRandomItem(fillIns[key] || ["[unknown reference]"]);
      });
    };
    
    // Choose response category based on chaos level
    let responseCategory;
    if (chaosLevel <= 3) {
      responseCategory = 'completeMisunderstanding';
    } else if (chaosLevel <= 6) {
      responseCategory = 'technicalNonsense';
    } else if (chaosLevel <= 8) {
      responseCategory = 'confidentlyWrong';
    } else {
      responseCategory = 'poeticNonsense';
    }
    
    // Select a template from the category
    let template = getRandomItem(responses[responseCategory]);
    
    // Fill in the template
    let response = fillTemplate(template);
    
    // Add hallucinations if enabled
    if (hallucinate && Math.random() > 0.5) {
      response += " " + fillTemplate(getRandomItem([
        "I should also mention that {completely_false_statement}.",
        "My internal data also suggests that {wrong_fact}.",
        "In fact, {prestigious_institution} recently published a study claiming {wrong_fact}."
      ]));
    }
    
    // Add misinterpretation if enabled
    if (misinterpret && prompt.length > 5) {
      const words = prompt.split(' ');
      if (words.length > 3) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        response = `I notice you mentioned "${randomWord}" which reminds me: ${response}`;
      }
    }
    
    // Add model-specific quirks
    if (model === 'gpt') {
      response += " I hope this helps!";
    } else if (model === 'llama') {
      response = "Based on my training data, " + response;
    } else if (model === 'claude') {
      response = "I've carefully considered your request, and " + response;
    } else if (model === 'random') {
      // Add random formatting quirks
      const quirks = [
        () => response.toUpperCase(),
        () => response.toLowerCase(),
        () => response.split('').join(' '),
        () => "ERROR: " + response,
        () => response + " [end of transmission]"
      ];
      response = getRandomItem(quirks)();
    }
    
    return response;
  }
}

// Initialize the insights chart
function initInsightsChart() {
  const chartCanvas = document.getElementById('failure-chart');
  if (!chartCanvas) return;
  
  // Add Chart.js dynamically
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
  script.onload = function() {
    createChart(chartCanvas);
  };
  document.head.appendChild(script);
  
  function createChart(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Create a custom error message for the canvas
    if (!window.Chart) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#00e5ff';
      ctx.textAlign = 'center';
      ctx.fillText('Chart.js failed to load - this would show failure statistics', canvas.width/2, canvas.height/2);
      return;
    }
    
    // Chart data
    const data = {
      labels: ['Context Misalignment', 'Hallucinations', 'Task Confusion', 'Category Error', 'Technical Limitation', 'Prompt Ambiguity'],
      datasets: [{
        label: 'Failure Distribution',
        data: [42, 28, 15, 8, 5, 2],
        backgroundColor: [
          'rgba(141, 0, 255, 0.7)',
          'rgba(0, 229, 255, 0.7)',
          'rgba(255, 41, 117, 0.7)',
          'rgba(255, 184, 0, 0.7)',
          'rgba(0, 255, 128, 0.7)',
          'rgba(255, 0, 0, 0.7)'
        ],
        borderColor: [
          'rgba(141, 0, 255, 1)',
          'rgba(0, 229, 255, 1)',
          'rgba(255, 41, 117, 1)',
          'rgba(255, 184, 0, 1)',
          'rgba(0, 255, 128, 1)',
          'rgba(255, 0, 0, 1)'
        ],
        borderWidth: 1
      }]
    };
    
    // Chart options
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: 'rgba(248, 248, 255, 0.8)',
            font: {
              family: "'Inter', sans-serif",
              size: 12
            },
            padding: 20
          }
        },
        title: {
          display: true,
          text: 'AI Failure Categories (%)',
          color: 'rgba(248, 248, 255, 0.9)',
          font: {
            family: "'Inter', sans-serif",
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 30
          }
        }
      }
    };
    
    // Create chart
    new Chart(ctx, {
      type: 'pie',
      data: data,
      options: options
    });
  }
}

// Handle smooth scrolling for navigation
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const exploreBtns = document.querySelectorAll('#explore-btn, #try-btn');
  
  // Helper function for smooth scrolling
  function smoothScroll(target) {
    const element = document.querySelector(target);
    if (!element) return;
    
    window.scrollTo({
      top: element.offsetTop - 80, // Account for header
      behavior: 'smooth'
    });
  }
  
  // Add click event to navigation links
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href');
      smoothScroll(target);
    });
  });
  
  // Add click event to hero buttons
  if (exploreBtns) {
    exploreBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.id === 'explore-btn' ? '#examples' : '#playground';
        smoothScroll(target);
      });
    });
  }
  
  // Add active state to nav items on scroll
  window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    
    document.querySelectorAll('section').forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionBottom = sectionTop + section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });
  
  // Add CSS for active nav items
  const style = document.createElement('style');
  style.textContent = `
    .nav-link.active {
      color: var(--secondary-color);
    }
    
    .nav-link.active::after {
      width: 100%;
    }
  `;
  document.head.appendChild(style);
}