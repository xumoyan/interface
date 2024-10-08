import { useV3Positions } from 'hooks/useV3Positions'
import CTACards from 'pages/LegacyPool/CTACards'
import { mocked } from 'test-utils/mocked'
import { render, screen } from 'test-utils/render'

jest.mock('hooks/useV3Positions')

describe('CTAcard links', () => {
  it('renders mainnet link when chain is not supported', () => {
    mocked(useV3Positions).mockReturnValue({ loading: false, positions: undefined })

    render(<CTACards />)
    expect(screen.getByTestId('cta-poolslink')).toHaveAttribute('href', '/explore/pools/ethereum')
  })
})
