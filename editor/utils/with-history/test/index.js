/**
 * Internal dependencies
 */
import withHistory from '../';

describe( 'withHistory', () => {
	const counter = ( state = { count: 0 }, { type } ) => (
		type === 'INCREMENT' ? { count: state.count + 1 } : state
	);

	it( 'should return a new reducer', () => {
		const reducer = withHistory( counter );

		expect( typeof reducer ).toBe( 'function' );
		expect( reducer( undefined, {} ) ).toEqual( {
			past: [ { count: 0 } ],
			present: { count: 0 },
			future: [],
		} );
	} );

	it( 'should track changes in present', () => {
		const reducer = withHistory( counter );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );

		expect( state ).toEqual( {
			past: [ { count: 0 } ],
			present: { count: 1 },
			future: [],
		} );
	} );

	it( 'should create undo level if buffer is available', () => {
		const reducer = withHistory( counter );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		state = reducer( state, { type: 'CREATE_UNDO_LEVEL' } );

		expect( state ).toEqual( {
			past: [ { count: 0 }, { count: 1 } ],
			present: { count: 1 },
			future: [],
		} );

		expect( state ).toBe( reducer( state, { type: 'CREATE_UNDO_LEVEL' } ) );
	} );

	it( 'should perform undo of buffer', () => {
		const reducer = withHistory( counter );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		state = reducer( state, { type: 'UNDO' } );

		expect( state ).toEqual( {
			past: [ { count: 0 } ],
			present: { count: 0 },
			future: [ { count: 1 } ],
		} );

		expect( state.past[ state.past.length - 1 ] ).toBe( state.present );
		expect( state ).toBe( reducer( state, { type: 'UNDO' } ) );
	} );

	it( 'should perform undo of last level', () => {
		const reducer = withHistory( counter );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		state = reducer( state, { type: 'CREATE_UNDO_LEVEL' } );
		state = reducer( state, { type: 'UNDO' } );

		expect( state ).toEqual( {
			past: [ { count: 0 } ],
			present: { count: 0 },
			future: [ { count: 1 } ],
		} );

		expect( state.past[ state.past.length - 1 ] ).toBe( state.present );
		expect( state ).toBe( reducer( state, { type: 'UNDO' } ) );
	} );

	it( 'should perform redo', () => {
		const reducer = withHistory( counter );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		state = reducer( state, { type: 'CREATE_UNDO_LEVEL' } );
		state = reducer( state, { type: 'UNDO' } );
		state = reducer( state, { type: 'REDO' } );

		expect( state ).toEqual( {
			past: [ { count: 0 }, { count: 1 } ],
			present: { count: 1 },
			future: [],
		} );

		expect( state.past[ state.past.length - 1 ] ).toBe( state.present );
		expect( state ).toBe( reducer( state, { type: 'REDO' } ) );
	} );

	it( 'should reset history by options.resetTypes', () => {
		const reducer = withHistory( counter, { resetTypes: [ 'RESET_HISTORY' ] } );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		state = reducer( state, { type: 'CREATE_UNDO_LEVEL' } );
		state = reducer( state, { type: 'RESET_HISTORY' } );

		expect( state ).toEqual( {
			past: [ { count: 1 } ],
			present: { count: 1 },
			future: [],
		} );
	} );
} );
