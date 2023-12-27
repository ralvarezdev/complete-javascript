'use strict';


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout
{
  date = new Date();
  id = (Date.now() + '').slice(-10);
  #clicks = 0;

  constructor (coords, distance, duration)
  {
    this.coords = coords; // [lat, lng]
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription ()
  {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${ this.type[0].toUpperCase() }${ this.type.slice(1) } on ${ months[this.date.getMonth()] } ${ this.date.getDate() }`;
  }

  _click ()
  {
    this.#clicks++;
  }
}

class Running extends Workout
{
  type = 'running';

  constructor (coords, distance, duration, cadence)
  {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.pace = this.calcPace();
    this._setDescription();
  }

  calcPace ()
  {
    // min/km

    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout
{
  type = 'cycling';

  constructor (coords, distance, duration, elevationGain)
  {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.speed = this.calcSpeed();
    this._setDescription();
  }

  calcSpeed ()
  {
    // km/h

    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App
{
  #map;
  #mapEvent;
  #mapZoom = 13;
  #workouts = [];

  constructor ()
  {
    this._getPosition();

    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.value = 'running';
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition ()
  {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function ()
      {
        alert('Couldn\'t get your position');
      });
  }

  _loadMap (position)
  {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];
    console.log(coords);

    this.#map = L.map('map').setView(coords, this.#mapZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(workout => this._renderWorkoutMarker(workout));
  }

  _showForm (event)
  {
    this.#mapEvent = event;
    form.classList.remove('hidden');

    inputDistance.focus();
  }

  _hideForm ()
  {
    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => form.style.display = 'grid', 1000);
  }

  _toggleElevationField ()
  {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout (event)
  {
    const validInputs = (...inputs) =>
    {
      return inputs.every(input => Number.isFinite(input));
    };
    const positiveInputs = (...inputs) =>
    {
      return inputs.every(input => input > 0);
    };

    event.preventDefault();

    const { lat, lng } = this.#mapEvent.latlng;

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;

    if (type === 'running')
    {
      const cadence = +inputCadence.value;

      if (!validInputs(distance, duration, cadence) || !positiveInputs(distance, duration, cadence))
        return alert('Input have to be a positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    if (type === 'cycling')
    {
      const elevation = +inputElevation.value;

      if (!validInputs(distance, duration, elevation) || !positiveInputs(distance, duration))
        return alert('Input have to be a positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);
    console.log(this.#workouts);

    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._hideForm();
    this._setLocalStorage();
  }

  _renderWorkoutMarker (workout)
  {
    L.marker(workout.coords).addTo(this.#map)
      .bindPopup(L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${ workout.type }-popup`
      }))
      .setPopupContent(`${ workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' } ${ workout.description }`)
      .openPopup();
  }

  _renderWorkout (workout)
  {
    let html = `
      <li class="workout workout--${ workout.type }" data-id="${ workout.id }">
        <h2 class="workout__title">${ workout.description }</h2>
        <div class="workout__details">
          <span class="workout__icon">${ workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️' } </span>
          <span class="workout__value">${ workout.distance }</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${ workout.duration }</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${ workout.pace.toFixed(1) }</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${ workout.cadence }</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;

    if (workout.type === 'cycling')
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${ workout.speed.toFixed(1) }</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${ workout.elevationGain }</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup (event)
  {
    const workoutEl = event.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);

    this.#map.setView(workout.coords, this.#mapZoom, {
      animate: true,
      pan: {
        duration: 1
      }
    });

    workout._click();
  }

  _setLocalStorage ()
  {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage ()
  {
    const data = localStorage.getItem('workouts');

    if (!data) return;

    this.#workouts = JSON.parse(data);

    this.#workouts.forEach(workout => this._renderWorkout(workout));
  }

  reset ()
  {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();