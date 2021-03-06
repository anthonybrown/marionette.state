/*jscs:disable maximumLineLength */
describe('State Functions', () => {
  describe('State.syncEntityEvents()', () => {
    var AbstractStateful;

    beforeEach(() => {
      var State = Mn.State.extend({
        defaultState: {
          foo: 1,
          bar: 2,
          baz: 3
        }
      });

      var Model = Bb.Model.extend({
        defaults: {
          foo: 1,
          bar: 2,
          baz: 3
        }
      });

      var Collection = Bb.Collection;

      AbstractStateful = Mn.Object.extend({
        stateEvents: {
          'all':                              'onAll',
          'change':                           'onChange onChange2',
          'change:foo':                       'onChangeFoo',
          'reset':                            'onReset',
          'change:foo change:bar change:baz': 'onChangeFooBarBaz'
        },
        modelEvents: {
          'all':                              'onAll',
          'change':                           'onChange onChange2',
          'change:foo':                       'onChangeFoo',
          'reset':                            'onReset',
          'change:foo change:bar change:baz': 'onChangeFooBarBaz'
        },
        collectionEvents: {
          'all':        'onCollectionAll',
          'reset':      'onCollectionReset onCollectionReset2',
          'all reset':  'onCollectionAllReset',
          'add':        'onCollectionAdd',
          'remove':     'onCollectionRemove',
          'change':     'onCollectionChange',
          'change:foo': 'onCollectionChangeFoo'
        },
        constructor() {
          this.state = new State();
          this.model = new Model();
          this.collection = new Collection();
          AbstractStateful.__super__.constructor.apply(this, arguments);
        },
        onAll:                 stub(),
        onChange:              stub(),
        onChange2:             stub(),
        onChangeFoo:           stub(),
        onChangeFooBarBaz:     stub(),
        onReset:               stub(),
        onCollectionAll:       stub(),
        onCollectionReset:     stub(),
        onCollectionReset2:    stub(),
        onCollectionAllReset:  stub(),
        onCollectionAdd:       stub(),
        onCollectionRemove:    stub(),
        onCollectionChange:    stub(),
        onCollectionChangeFoo: stub()
      });
    });

    describe('when syncing', () => {
      var stateful;
      var onInlineChange;
      var onInlineReset;

      beforeEach(() => {
        onInlineChange = stub();
        onInlineReset = stub();
        var Stateful = AbstractStateful.extend({
          inlineEvents: {
            'change': onInlineChange,
            'reset':  onInlineReset
          },
          initialize() {
            Mn.State.syncEntityEvents(this, this.state, this.stateEvents);
            Mn.State.syncEntityEvents(this, this.model, this.modelEvents);
            Mn.State.syncEntityEvents(this, this.collection, this.collectionEvents);

            Mn.State.syncEntityEvents(this, this.state, this.inlineEvents);
            Mn.State.syncEntityEvents(this, this.model, this.inlineEvents);
            Mn.State.syncEntityEvents(this, this.collection, this.inlineEvents);
          }
        });
        stateful = new Stateful();
      });

      it('should call handlers for Model or State {change|change:value|all} events', () => {
        expect(stateful.onAll).to.have.been.calledTwice;
        expect(stateful.onChange).to.have.been.calledTwice;
        expect(stateful.onChangeFoo).to.have.been.calledTwice;
      });

      it('should not call handlers for Model or State events besides {change|change:value|all}', () => {
        expect(stateful.onReset).to.not.have.been.calledTwice;
      });

      it('should call handlers for Collection {all|reset} events', () => {
        expect(stateful.onCollectionAll).to.have.been.calledOnce;
        expect(stateful.onCollectionReset).to.have.been.calledOnce;
      });

      it('should not call handlers for Collection events besides {all|reset}', () => {
        expect(stateful.onCollectionAdd).to.not.have.been.called;
        expect(stateful.onCollectionRemove).to.not.have.been.called;
        expect(stateful.onCollectionChange).to.not.have.been.called;
        expect(stateful.onCollectionChangeFoo).to.not.have.been.called;
      });

      it('should call handlers with the target object as context', () => {
        expect(stateful.onAll).to.always.have.been.calledOn(stateful);
        expect(stateful.onCollectionAll).to.always.have.been.calledOn(stateful);
      });

      it('should call handlers with standard Backbone event arguments', () => {
        expect(stateful.onChange).to.have.been.calledTwice
          .to.have.been.calledTwice
          .and.to.have.been.calledWith(stateful.model)
          .and.to.have.been.calledWith(stateful.state);
        expect(stateful.onChangeFoo).to.have.been.calledTwice
          .to.have.been.calledTwice
          .and.to.have.been.calledWith(stateful.model, 1)
          .and.to.have.been.calledWith(stateful.state, 1);
        expect(stateful.onCollectionReset)
          .to.have.been.calledOnce
          .and.to.have.been.calledWith(stateful.collection);
      });

      it('should pass { syncing: true } as a Backbone event handler option', () => {
        expect(stateful.onChange).to.have.been.calledTwice
          .to.have.been.calledTwice
          .and.to.have.been.calledWith(stateful.model, { syncing: true })
          .and.to.have.been.calledWith(stateful.state, { syncing: true });
        expect(stateful.onChangeFoo).to.have.been.calledTwice
          .to.have.been.calledTwice
          .and.to.have.been.calledWith(stateful.model, 1, { syncing: true })
          .and.to.have.been.calledWith(stateful.state, 1, { syncing: true });
        expect(stateful.onCollectionReset)
          .to.have.been.calledOnce
          .and.to.have.been.calledWith(stateful.collection, { syncing: true });
      });

      it('should call handler for multiple inlined events', () => {
        expect(stateful.onChangeFooBarBaz.callCount).to.equal(6);
        expect(stateful.onCollectionAllReset.callCount).to.equal(2);
      });

      it('should call multiple handlers for a single event', () => {
        expect(stateful.onChange).to.have.been.calledTwice;
        expect(stateful.onChange2).to.have.been.calledTwice;
        expect(stateful.onCollectionReset).to.have.been.calledOnce;
        expect(stateful.onCollectionReset2).to.have.been.calledOnce;
      });

      it('should call inline function handlers', () => {
        expect(onInlineChange)
          .to.have.been.calledTwice
          .and.to.have.been.calledWith(stateful.model)
          .and.to.have.been.calledWith(stateful.state)
          .and.to.always.have.been.calledOn(stateful);
        expect(onInlineReset)
          .to.have.been.calledOnce
          .and.to.have.been.calledWith(stateful.collection)
          .and.to.always.have.been.calledOn(stateful);
      });
    });

    describe('when syncing with missing parameters', () => {
      var stateful;

      beforeEach(() => {
        var Stateful = AbstractStateful.extend({
          syncWithoutBindings() {
            Mn.State.syncEntityEvents(this, this.state, null);
          },

          syncWithoutEntity() {
            Mn.State.syncEntityEvents(this, null, this.stateEvents);
          }
        });
        stateful = new Stateful();
        sinon.spy(stateful, 'syncWithoutBindings');
        sinon.spy(stateful, 'syncWithoutEntity');
      });

      it('should throw an exception without bindings', () => {
        expect(() => stateful.syncWithoutBindings()).to.throw('`bindings` must be provided.');
      });

      it('should throw an exception without entity', () => {
        expect(() => stateful.syncWithoutEntity()).to.throw('`entity` must be provided.');
      });
    });

    describe('when syncing on a target event', () => {
      var stateful;

      beforeEach(() => {
        var Stateful = AbstractStateful.extend({
          initialize() {
            this.stateSyncing =
              Mn.State.syncEntityEvents(this, this.state, this.stateEvents, 'render');
            this.modelSyncing =
              Mn.State.syncEntityEvents(this, this.model, this.stateEvents, 'render');
            this.collectionSyncing =
              Mn.State.syncEntityEvents(this, this.collection, this.collectionEvents, 'render');
          },
          render() {
            this.trigger('render');
          }
        });
        stateful = new Stateful();
      });

      it('should not sync immediately', () => {
        expect(stateful.onChange).to.not.have.been.called;
        expect(stateful.onChangeFoo).to.not.have.been.called;
        expect(stateful.onCollectionReset).to.not.have.been.called;
      });

      it('should sync on target event', () => {
        stateful.render();

        expect(stateful.onChange)
          .to.have.been.calledTwice
          .and.to.have.been.calledWith(stateful.model)
          .and.to.have.been.calledWith(stateful.state);
        expect(stateful.onChangeFoo)
          .to.have.been.calledTwice
          .and.to.have.been.calledWith(stateful.model, 1)
          .and.to.have.been.calledWith(stateful.state, 1);
        expect(stateful.onCollectionReset)
          .to.have.been.calledOnce
          .and.to.have.been.calledWith(stateful.collection);
      });

      describe('when calling stop on the Syncing instance', () => {
        beforeEach(() => {
          stateful.stateSyncing.stop();
          stateful.modelSyncing.stop();
          stateful.collectionSyncing.stop();
        });

        it('should not sync on target event', () => {
          stateful.render();
          expect(stateful.onChange).to.not.have.been.called;
          expect(stateful.onChangeFoo).to.not.have.been.called;
          expect(stateful.onCollectionReset).to.not.have.been.called;
        });

        it('should not fire change handlers for future change events', () => {
        });
      });
    });
  });

  describe('State.hasAnyChanged()', () => {
    var unchangedModel;
    var changedModel;
    var unchangedState;
    var changedState;

    beforeEach(() => {
      var Model = Bb.Model.extend({
        defaults: {
          foo: 1,
          bar: 2,
          baz: 3
        }
      });
      var State = Mn.State.extend({
        defaultState: {
          foo: 1,
          bar: 2,
          baz: 3
        }
      });

      unchangedModel = new Model();
      changedModel = new Model();
      changedModel.set({
        foo: 10,
        bar: 20,
        baz: 3
      });

      unchangedState = new State();
      changedState = new State();
      changedState.set({
        foo: 10,
        bar: 20,
        baz: 3
      });
    });

    describe('when model or state is newly created', () => {
      it('should return false for all default attributes', () => {
        expect(Mn.State.hasAnyChanged(unchangedModel, 'foo', 'bar', 'baz')).to.equal(false);
        expect(Mn.State.hasAnyChanged(unchangedState, 'foo', 'bar', 'baz')).to.equal(false);
      });
    });

    describe('when model or state is set with some changed and some unchanged attributes', () => {
      it('should return true for all changed attributes', () => {
        expect(Mn.State.hasAnyChanged(changedModel, 'foo', 'bar')).to.equal(true);
        expect(Mn.State.hasAnyChanged(changedState, 'foo', 'bar')).to.equal(true);
      });
      it('should return true for some changed and some unchanged attributes', () => {
        expect(Mn.State.hasAnyChanged(changedModel, 'foo', 'baz')).to.equal(true);
        expect(Mn.State.hasAnyChanged(changedState, 'foo', 'baz')).to.equal(true);
      });
      it('should return false for all unchanged attributes', () => {
        expect(Mn.State.hasAnyChanged(changedModel, 'baz')).to.equal(false);
        expect(Mn.State.hasAnyChanged(changedState, 'baz')).to.equal(false);
      });
    });
  });
});
