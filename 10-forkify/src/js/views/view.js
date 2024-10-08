import icons from 'url:../../img/icons.svg';

export default class View {
    _data;

    /**
     * Render the Received Object to the DOM
     * @param {Object | Object[]} data The Data to be Rendered
     * @returns {undefined}
     * @this {Object} View Instance
     * @author ralvarezdev
     * @todo Finish Implementation
     */
    render(data) {
        if (!data || (Array.isArray(data) && data.length === 0)) return this.renderError();

        this._data = data;
        const markup = this._generateMarkup();

        this._clear();
        this._parentElement.insertAdjacentHTML('afterbegin', markup);
    }

    update(data) {
        // if (!data || (Array.isArray(data) && data.length === 0)) return this.renderError();

        this._data = data;
        const newMarkup = this._generateMarkup();

        const newDOM = document.createRange().createContextualFragment(newMarkup);
        const newElements = Array.from(newDOM.querySelectorAll('*'));
        const currElements = Array.from(this._parentElement.querySelectorAll('*'));

        newElements.forEach((newEl, i) => {
            const currEl = currElements.at(i);

            // Checks if Nodes are Different from Each Other
            if (newEl.isEqualNode(currEl)) return;

            // Checks if it's First Child is Text
            if (newEl.firstChild?.nodeValue.trim() !== '')
                // Update Changed Text
                currEl.textContent = newEl.textContent;

            // Update Node Attributes
            Array.from(newEl.attributes).forEach(atr => currEl.setAttribute(atr.name, atr.value));
        });
    }

    _clear() {
        this._parentElement.innerHTML = '';
    }

    renderSpinner() {
        const markup = `
    <div class="spinner">
      <svg>
        <use href="${icons}#icon-loader"></use>
      </svg>
    </div>
    `;
        this._parentElement.innerHTML = '';
        this._parentElement.insertAdjacentHTML('afterbegin', markup);
    };

    renderError(message = this._errorMessage) {
        const markup = `
    <div class="error">
      <div>
        <svg>
          <use href="${icons}#icon-alert-triangle"></use>
        </svg>
      </div>
      <p>${message}</p>
    </div>
    `;

        this._clear();
        this._parentElement.insertAdjacentHTML('afterbegin', markup);
    }

    renderMessage(message = this._successMessage) {
        const markup = `
    <div class="message">
      <div>
        <svg>
          <use href="${icons}#icon-smile"></use>
        </svg>
      </div>
      <p>${message}</p>
    </div>
    `;

        this._clear();
        this._parentElement.insertAdjacentHTML('afterbegin', markup);
    }
}