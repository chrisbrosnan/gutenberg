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
			past: [],
			present: { count: 0 },
			buffer: { count: 0 },
			future: [],
		} );
	} );

	it( 'should track changes in buffer', () => {
		const reducer = withHistory( counter );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );

		expect( state ).toEqual( {
			past: [],
			present: { count: 0 },
			buffer: { count: 1 },
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
			past: [ { count: 0 } ],
			present: { count: 1 },
			buffer: { count: 1 },
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
			past: [],
			present: { count: 0 },
			buffer: { count: 0 },
			future: [ { count: 1 } ],
		} );

		expect( state.present ).toBe( state.buffer );
		expect( state ).toBe( reducer( state, { type: 'UNDO' } ) );
	} );

	it( 'should perform undo of present level', () => {
		const reducer = withHistory( counter );

		let state;
		state = reducer( undefined, {} );
		state = reducer( state, { type: 'INCREMENT' } );
		state = reducer( state, { type: 'CREATE_UNDO_LEVEL' } );
		state = reducer( state, { type: 'UNDO' } );

		expect( state ).toEqual( {
			past: [],
			present: { count: 0 },
			buffer: { count: 0 },
			future: [ { count: 1 } ],
		} );

		expect( state.present ).toBe( state.buffer );
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
			past: [ { count: 0 } ],
			present: { count: 1 },
			buffer: { count: 1 },
			future: [],
		} );

		expect( state.present ).toBe( state.buffer );
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
			past: [],
			present: { count: 1 },
			buffer: { count: 1 },
			future: [],
		} );
	} );
} );
