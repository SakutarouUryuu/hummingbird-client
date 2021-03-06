import Controller from 'ember-controller';
import get from 'ember-metal/get';
import set from 'ember-metal/set';
import service from 'ember-service/inject';
import computed, { alias } from 'ember-computed';
import { task } from 'ember-concurrency';
import getter from 'client/utils/getter';
import errorMessages from 'client/utils/error-messages';
import COUNTRIES from 'client/utils/countries';
import moment from 'moment';

export default Controller.extend({
  notify: service(),
  user: alias('session.account'),
  languages: getter(() => [{ id: 'en', text: 'English' }]),
  timezoneGuess: getter(() => moment.tz.guess()),
  timezones: getter(() => moment.tz.names()),

  countries: getter(() => (
    Object.keys(COUNTRIES).map(key => ({ id: key, text: COUNTRIES[key] })).sortBy('text')
  )),

  titles: getter(() => (
    ['Canonical', 'Romanized', 'English'].map(key => ({ id: key.toLowerCase(), text: key }))
  )),

  filters: getter(() => (
    [{ value: true, text: 'Hide Adult Content' },
    { value: false, text: 'Show Adult Content (¬‿¬ )' }]
  )),

  isValid: computed('username', 'user.hasDirtyAttributes', 'user.name', function() {
    if (get(this, 'user.hasDirtyAttributes')) { return true; }
    return get(this, 'user.name') !== get(this, 'username');
  }).readOnly(),

  updateProfile: task(function* () {
    set(this, 'user.name', get(this, 'username'));
    yield get(this, 'user').save()
      .then(() => get(this, 'notify').success('Your profile was updated.'))
      .catch((err) => {
        get(this, 'notify').error(errorMessages(err));
        get(this, 'user').rollbackAttributes();
        set(this, 'username', get(this, 'user.name'));
      });
  }).drop(),

  init() {
    this._super(...arguments);
    // copy so we aren't manipulating the user's name directly
    set(this, 'username', get(this, 'user.name'));

    // find our object associated with our user properties
    const language = get(this, 'languages')
      .find(item => get(item, 'id') === get(this, 'user.language'));
    set(this, 'selectedLanguage', language);
    const country = get(this, 'countries')
      .find(item => get(item, 'id') === get(this, 'user.country'));
    set(this, 'selectedCountry', country);
    const title = get(this, 'titles')
      .find(item => get(item, 'id') === get(this, 'user.titleLanguagePreference'));
    set(this, 'selectedTitle', title);
    const filter = get(this, 'filters')
      .find(item => get(item, 'value') === get(this, 'user.sfwFilter'));
    set(this, 'selectedFilter', filter);
  },

  actions: {
    changeLanguage(language) {
      set(this, 'selectedLanguage', language);
      set(this, 'user.language', get(language, 'id'));
    },

    changeCountry(country) {
      set(this, 'selectedCountry', country);
      set(this, 'user.country', get(country, 'id'));
    },

    changeTitle(title) {
      set(this, 'selectedTitle', title);
      set(this, 'user.titleLanguagePreference', get(title, 'id'));
    },

    changeFilter(filter) {
      set(this, 'selectedFilter', filter);
      set(this, 'user.sfwFilter', get(filter, 'value'));
    }
  }
});
